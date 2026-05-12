package com.kumorai.nexo.campus.controller;

import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.campus.dto.RouteRequest;
import com.kumorai.nexo.campus.dto.RouteResponse;
import com.kumorai.nexo.campus.service.CampusService;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.user.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campus")
@RequiredArgsConstructor
public class CampusController {

    private final CampusService campusService;
    private final UserService userService;

    @Value("${nexo.upload.dir}")
    private String uploadDir;

    @Value("${nexo.here.api-key}")
    private String hereApiKey;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Route Proxy (HERE Public Transit API v8)

    @PostMapping("/route")
    public ResponseEntity<RouteResponse> getRoute(@Valid @RequestBody RouteRequest req) {
        try {
            if (!StringUtils.hasText(hereApiKey) || "REEMPLAZA_CON_TU_KEY".equals(hereApiKey)) {
                throw NexoException.badRequest("HERE_API_KEY no esta configurada");
            }

            String origin = req.originLat() + "," + req.originLng();
            String dest   = req.destLat()   + "," + req.destLng();

            String url = "https://transit.hereapi.com/v8/routes"
                    + "?origin="      + URLEncoder.encode(origin, StandardCharsets.UTF_8)
                    + "&destination=" + URLEncoder.encode(dest,   StandardCharsets.UTF_8)
                    + "&return=polyline,actions,intermediate"
                    + "&modes=bus,busRapid"
                    + "&alternatives=2"
                    + "&lang=es-CO"
                    + "&apiKey=" + URLEncoder.encode(hereApiKey, StandardCharsets.UTF_8);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> resp = client.send(httpReq, HttpResponse.BodyHandlers.ofString());
            JsonNode root = MAPPER.readTree(resp.body());

            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                String message = root.path("title").asText(root.path("cause").asText("HERE Transit error"));
                String details = root.path("error_description").asText(root.path("error").asText(""));
                throw NexoException.badRequest("HERE Transit (" + resp.statusCode() + "): " + message + (details.isBlank() ? "" : " - " + details));
            }

            JsonNode routes = root.path("routes");
            if (!routes.isArray() || routes.isEmpty()) {
                throw NexoException.badRequest("No se encontro una ruta en transporte publico");
            }

            List<RouteResponse.RouteAlternative> alternatives = new ArrayList<>();
            for (int i = 0; i < routes.size(); i++) {
                alternatives.add(parseHereRoute(routes.get(i), i == 0 ? "Recomendada" : "Alternativa " + (i + 1)));
            }

            RouteResponse.RouteAlternative best = alternatives.get(0);
            List<List<Double>> coordinates = best.coordinates();

            if (coordinates.isEmpty()) {
                throw NexoException.badRequest("HERE no retorno geometria para la ruta");
            }

            List<RouteResponse.RouteModeSummary> modeSummaries = new ArrayList<>();
            modeSummaries.add(new RouteResponse.RouteModeSummary("TRANSIT", "Transporte publico", best.totalDuration(), best.totalDistance()));
            modeSummaries.addAll(fetchPersonalModeSummaries(origin, dest));

            return ResponseEntity.ok(new RouteResponse("", coordinates, best.totalDuration(), best.totalDistance(), best.steps(), alternatives, modeSummaries));

        } catch (NexoException e) {
            throw e;
        } catch (Exception e) {
            throw NexoException.badRequest("Error consultando la ruta: " + e.getMessage());
        }
    }

    // ── Campus ────────────────────────────────────────────────────────────────

    private static String transitLineName(JsonNode transport) {
        String name = transport.path("shortName").asText("");
        if (name.isBlank()) name = transport.path("name").asText("");
        if (name.isBlank()) name = transport.path("headsign").asText("");
        return name;
    }

    private static String placeName(JsonNode place) {
        return place.path("name").asText("");
    }

    private static RouteResponse.RouteAlternative parseHereRoute(JsonNode route, String label) {
        List<RouteResponse.RouteStep> steps = new ArrayList<>();
        List<List<Double>> coordinates = new ArrayList<>();
        int totalSeconds = 0;
        int totalMeters = 0;

        for (JsonNode section : route.path("sections")) {
            String encoded = section.path("polyline").asText("");
            if (!encoded.isBlank()) {
                coordinates.addAll(decodeFlexiblePolyline(encoded));
            }

            JsonNode summary = section.path("travelSummary").isMissingNode()
                    ? section.path("summary")
                    : section.path("travelSummary");
            int sectionSeconds = summary.path("duration").asInt(0);
            int sectionMeters = summary.path("length").asInt(0);
            totalSeconds += sectionSeconds;
            totalMeters += sectionMeters;

            JsonNode transport = section.path("transport");
            String mode = transport.path("mode").asText(section.path("type").asText("")).toUpperCase();
            boolean isTransit = !"PEDESTRIAN".equals(mode) && !"WALK".equals(mode) && !"WALKING".equals(mode);
            String travelMode = isTransit ? "TRANSIT" : "WALKING";
            String transitLine = transitLineName(transport);

            if (isTransit) {
                String from = placeName(section.path("departure").path("place"));
                String to = placeName(section.path("arrival").path("place"));
                String instruction = "Toma " + (transitLine.isBlank() ? "TransMilenio/SITP" : transitLine)
                        + (from.isBlank() ? "" : " desde " + from)
                        + (to.isBlank() ? "" : " hasta " + to);
                int stops = section.path("intermediateStops").isArray() ? section.path("intermediateStops").size() : 0;
                if (stops > 0) instruction += " (" + stops + " paradas intermedias)";
                steps.add(new RouteResponse.RouteStep(instruction, formatDuration(sectionSeconds), formatDistance(sectionMeters), travelMode, transitLine));
                continue;
            }

            if (section.path("actions").isArray() && !section.path("actions").isEmpty()) {
                for (JsonNode action : section.path("actions")) {
                    String instruction = action.path("instruction").asText("Camina hacia la siguiente conexion")
                            .replaceAll("<[^>]+>", " ")
                            .replaceAll("\\s+", " ")
                            .trim();
                    steps.add(new RouteResponse.RouteStep(
                            instruction,
                            formatDuration(action.path("duration").asInt(0)),
                            formatDistance(action.path("length").asInt(0)),
                            travelMode,
                            ""
                    ));
                }
            } else {
                steps.add(new RouteResponse.RouteStep("Camina hacia la siguiente conexion", formatDuration(sectionSeconds), formatDistance(sectionMeters), travelMode, ""));
            }
        }

        return new RouteResponse.RouteAlternative(label, formatDuration(totalSeconds), formatDistance(totalMeters), coordinates, steps);
    }

    private List<RouteResponse.RouteModeSummary> fetchPersonalModeSummaries(String origin, String dest) {
        List<RouteResponse.RouteModeSummary> summaries = new ArrayList<>();
        summaries.add(fetchRoutingSummary(origin, dest, "pedestrian", "A pie"));
        summaries.add(fetchRoutingSummary(origin, dest, "car", "Carro"));
        summaries.add(fetchRoutingSummary(origin, dest, "bicycle", "Bici"));
        return summaries.stream().filter(s -> s.duration() != null && !s.duration().isBlank()).toList();
    }

    private RouteResponse.RouteModeSummary fetchRoutingSummary(String origin, String dest, String mode, String label) {
        try {
            String url = "https://router.hereapi.com/v8/routes"
                    + "?origin=" + URLEncoder.encode(origin, StandardCharsets.UTF_8)
                    + "&destination=" + URLEncoder.encode(dest, StandardCharsets.UTF_8)
                    + "&transportMode=" + mode
                    + "&return=summary"
                    + "&apiKey=" + URLEncoder.encode(hereApiKey, StandardCharsets.UTF_8);

            HttpRequest httpReq = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> resp = HttpClient.newHttpClient().send(httpReq, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                return new RouteResponse.RouteModeSummary(mode.toUpperCase(), label, "", "");
            }

            JsonNode root = MAPPER.readTree(resp.body());
            JsonNode sections = root.path("routes").path(0).path("sections");
            int seconds = 0;
            int meters = 0;
            for (JsonNode section : sections) {
                JsonNode summary = section.path("summary");
                seconds += summary.path("duration").asInt(0);
                meters += summary.path("length").asInt(0);
            }
            return new RouteResponse.RouteModeSummary(mode.toUpperCase(), label, formatDuration(seconds), formatDistance(meters));
        } catch (Exception ignored) {
            return new RouteResponse.RouteModeSummary(mode.toUpperCase(), label, "", "");
        }
    }

    private static String formatDuration(int seconds) {
        if (seconds <= 0) return "";
        int minutes = Math.max(1, Math.round(seconds / 60f));
        if (minutes < 60) return minutes + " min";
        int hours = minutes / 60;
        int rest = minutes % 60;
        return rest == 0 ? hours + " h" : hours + " h " + rest + " min";
    }

    private static String formatDistance(int meters) {
        if (meters <= 0) return "";
        if (meters < 1000) return meters + " m";
        return String.format(java.util.Locale.US, "%.1f km", meters / 1000.0);
    }

    private static List<List<Double>> decodeFlexiblePolyline(String encoded) {
        if (encoded == null || encoded.isBlank()) return List.of();

        int[] index = {0};
        long version = decodeUnsigned(encoded, index);
        if (version != 1) {
            throw NexoException.badRequest("Version de flexible polyline no soportada: " + version);
        }

        long header = decodeUnsigned(encoded, index);
        int precision = (int) (header & 15);
        int thirdDim = (int) ((header >> 4) & 7);
        double factor = Math.pow(10, precision);
        long lat = 0;
        long lng = 0;
        List<List<Double>> coordinates = new ArrayList<>();

        while (index[0] < encoded.length()) {
            lat += decodeSigned(encoded, index);
            lng += decodeSigned(encoded, index);
            if (thirdDim != 0) {
                decodeSigned(encoded, index);
            }
            coordinates.add(List.of(lat / factor, lng / factor));
        }

        return coordinates;
    }

    private static long decodeSigned(String encoded, int[] index) {
        long value = decodeUnsigned(encoded, index);
        return (value & 1) == 0 ? value >> 1 : -((value + 1) >> 1);
    }

    private static long decodeUnsigned(String encoded, int[] index) {
        long result = 0;
        int shift = 0;

        while (index[0] < encoded.length()) {
            int value = decodeChar(encoded.charAt(index[0]++));
            result |= (long) (value & 31) << shift;
            if ((value & 32) == 0) return result;
            shift += 5;
        }

        throw NexoException.badRequest("Flexible polyline invalida");
    }

    private static int decodeChar(char c) {
        if (c >= 'A' && c <= 'Z') return c - 'A';
        if (c >= 'a' && c <= 'z') return c - 'a' + 26;
        if (c >= '0' && c <= '9') return c - '0' + 52;
        if (c == '-') return 62;
        if (c == '_') return 63;
        throw NexoException.badRequest("Caracter invalido en flexible polyline");
    }

    @GetMapping
    public ResponseEntity<List<CampusResponse>> listAll(@RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(campusService.listAll(faculty));
    }

    @GetMapping("/{campusId}")
    public ResponseEntity<CampusResponse> getById(@PathVariable Long campusId) {
        return ResponseEntity.ok(campusService.getById(campusId));
    }

    @PutMapping("/{campusId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<CampusResponse> update(@PathVariable Long campusId,
                                                 @Valid @RequestBody CampusRequest request) {
        return ResponseEntity.ok(campusService.update(campusId, request));
    }

    @PostMapping
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<CampusResponse> create(@Valid @RequestBody CampusRequest request) {
        return ResponseEntity.ok(campusService.create(request));
    }

    @DeleteMapping("/{campusId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> delete(@PathVariable Long campusId) {
        campusService.delete(campusId);
        return ResponseEntity.noContent().build();
    }

    // ── Classrooms ────────────────────────────────────────────────────────────

    @GetMapping("/{campusId}/classrooms")
    public ResponseEntity<List<ClassroomResponse>> listClassrooms(@PathVariable Long campusId) {
        return ResponseEntity.ok(campusService.listClassrooms(campusId));
    }

    @PostMapping("/{campusId}/classrooms")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> addClassroom(@PathVariable Long campusId,
                                                          @Valid @RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(campusService.addClassroom(campusId, request));
    }

    @PutMapping("/{campusId}/classrooms/{classroomId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> updateClassroom(@PathVariable Long campusId,
                                                             @PathVariable Long classroomId,
                                                             @Valid @RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(campusService.updateClassroom(campusId, classroomId, request));
    }

    @DeleteMapping("/{campusId}/classrooms/{classroomId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long campusId,
                                                @PathVariable Long classroomId) {
        campusService.deleteClassroom(campusId, classroomId);
        return ResponseEntity.noContent().build();
    }

    // ── Photos ────────────────────────────────────────────────────────────────

    @PostMapping("/{campusId}/classrooms/{classroomId}/photos")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<ClassroomResponse> addPhoto(@PathVariable Long campusId,
                                                      @PathVariable Long classroomId,
                                                      @RequestParam("photo") MultipartFile photo,
                                                      @AuthenticationPrincipal String email) {
        if (photo.isEmpty()) {
            throw NexoException.badRequest("El archivo de foto está vacío");
        }

        String ext = StringUtils.getFilenameExtension(photo.getOriginalFilename());
        String filename = UUID.randomUUID() + (ext != null ? "." + ext : "");
        Path dest = Paths.get(uploadDir).toAbsolutePath().resolve(filename);

        try {
            Files.createDirectories(dest.getParent());
            Files.copy(photo.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la foto", e);
        }

        Long uploadedBy = userService.getMyProfile(email).id();
        String photoUrl = uploadDir + "/" + filename;
        return ResponseEntity.ok(campusService.addPhoto(campusId, classroomId, photoUrl, uploadedBy));
    }

    @DeleteMapping("/{campusId}/classrooms/{classroomId}/photos/{photoId}")
    @PreAuthorize("hasRole('RADICADOR_SEDES') or hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long campusId,
                                            @PathVariable Long classroomId,
                                            @PathVariable Long photoId) {
        campusService.deletePhoto(campusId, classroomId, photoId);
        return ResponseEntity.noContent().build();
    }
}
