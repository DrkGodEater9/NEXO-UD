package com.kumorai.nexo.schedule.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.kumorai.nexo.academic.entity.TimeBlock;
import com.kumorai.nexo.academic.repository.SubjectGroupRepository;
import com.kumorai.nexo.schedule.dto.ScheduleBlockResponse;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.schedule.entity.Schedule;
import com.kumorai.nexo.schedule.entity.ScheduleBlock;
import com.kumorai.nexo.schedule.repository.ScheduleRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScheduleExportServiceImpl implements ScheduleExportService {

    private final ScheduleRepository scheduleRepository;
    private final SubjectGroupRepository subjectGroupRepository;

    // ── Grid constants ────────────────────────────────────────────────────────

    private static final int HOUR_COL_W = 60;
    private static final int DAY_COL_W  = 155;
    private static final int HEADER_H   = 40;
    private static final int HOUR_ROW_H = 50;
    private static final int START_HOUR = 6;
    private static final int END_HOUR   = 22;
    private static final int IMG_W      = HOUR_COL_W + 6 * DAY_COL_W;  // 990
    private static final int IMG_H      = HEADER_H + (END_HOUR - START_HOUR) * HOUR_ROW_H; // 840

    private static final String[] DAY_LABELS = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"};

    private static final Map<String, Integer> DAY_INDEX = Map.of(
            "LUNES", 0, "MARTES", 1, "MIERCOLES", 2,
            "JUEVES", 3, "VIERNES", 4, "SABADO", 5
    );

    private static final Color[] PALETTE = {
            new Color(0x4285F4), new Color(0xEA4335), new Color(0x34A853),
            new Color(0xFBBC04), new Color(0xFF6D00), new Color(0x9C27B0),
            new Color(0x00ACC1), new Color(0xF06292)
    };

    // ── Public API ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ScheduleResponse getWithBlocks(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findByIdAndUserIdWithBlocks(scheduleId, userId)
                .orElseThrow(() -> NexoException.notFound("Horario no encontrado"));
        return toResponse(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateImage(Long scheduleId, Long userId) {
        ScheduleResponse schedule = getWithBlocks(scheduleId, userId);
        return renderImage(schedule);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generatePdf(Long scheduleId, Long userId) {
        ScheduleResponse schedule = getWithBlocks(scheduleId, userId);
        byte[] imageBytes = renderImage(schedule);
        return renderPdf(schedule, imageBytes);
    }

    // ── Image rendering ───────────────────────────────────────────────────────

    private byte[] renderImage(ScheduleResponse schedule) {
        List<RenderSlot> slots = collectSlots(schedule);

        BufferedImage img = new BufferedImage(IMG_W, IMG_H, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // White background
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, IMG_W, IMG_H);

        // Day headers
        g.setFont(new Font("SansSerif", Font.BOLD, 13));
        for (int d = 0; d < DAY_LABELS.length; d++) {
            int x = HOUR_COL_W + d * DAY_COL_W;
            g.setColor(new Color(0x3C5DA8));
            g.fillRect(x, 0, DAY_COL_W, HEADER_H);
            g.setColor(Color.WHITE);
            FontMetrics fm = g.getFontMetrics();
            int textX = x + (DAY_COL_W - fm.stringWidth(DAY_LABELS[d])) / 2;
            g.drawString(DAY_LABELS[d], textX, (HEADER_H + fm.getAscent() - fm.getDescent()) / 2);
        }

        // Grid lines
        g.setColor(new Color(0xDDDDDD));
        for (int h = 0; h <= END_HOUR - START_HOUR; h++) {
            int y = HEADER_H + h * HOUR_ROW_H;
            g.drawLine(HOUR_COL_W, y, IMG_W, y);
        }
        for (int d = 0; d <= DAY_LABELS.length; d++) {
            int x = HOUR_COL_W + d * DAY_COL_W;
            g.drawLine(x, HEADER_H, x, IMG_H);
        }

        // Hour labels
        g.setFont(new Font("SansSerif", Font.PLAIN, 11));
        g.setColor(new Color(0x666666));
        for (int h = START_HOUR; h < END_HOUR; h++) {
            int y = HEADER_H + (h - START_HOUR) * HOUR_ROW_H;
            g.drawString(h + ":00", 4, y + 14);
        }

        // Schedule blocks
        for (RenderSlot slot : slots) {
            Integer dayIdx = DAY_INDEX.get(slot.dayName().toUpperCase());
            if (dayIdx == null) continue;
            if (slot.startHour() < START_HOUR || slot.endHour() > END_HOUR || slot.startHour() >= slot.endHour()) continue;

            int x = HOUR_COL_W + dayIdx * DAY_COL_W + 2;
            int y = HEADER_H + (slot.startHour() - START_HOUR) * HOUR_ROW_H + 2;
            int w = DAY_COL_W - 4;
            int h = (slot.endHour() - slot.startHour()) * HOUR_ROW_H - 4;

            g.setColor(slot.color());
            g.fillRoundRect(x, y, w, h, 8, 8);
            g.setColor(slot.color().darker());
            g.drawRoundRect(x, y, w, h, 8, 8);

            g.setColor(Color.WHITE);
            g.setFont(new Font("SansSerif", Font.BOLD, 10));
            drawWrappedText(g, slot.label(), x + 5, y + 14, w - 10, h - 8);
        }

        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "PNG", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error al generar imagen del horario", e);
        }
    }

    // ── PDF rendering ─────────────────────────────────────────────────────────

    private byte[] renderPdf(ScheduleResponse schedule, byte[] imageBytes) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(new Rectangle(IMG_W + 40, IMG_H + 80),
                    20, 20, 20, 20);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph title = new Paragraph(schedule.name() + "  —  " + schedule.semester(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            doc.add(title);

            com.lowagie.text.Image pdfImg = com.lowagie.text.Image.getInstance(imageBytes);
            pdfImg.setAlignment(Element.ALIGN_CENTER);
            doc.add(pdfImg);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF del horario", e);
        }
    }

    // ── Slot collection ───────────────────────────────────────────────────────

    private List<RenderSlot> collectSlots(ScheduleResponse schedule) {
        List<RenderSlot> slots = new ArrayList<>();
        int colorIdx = 0;

        for (ScheduleBlockResponse block : schedule.blocks()) {
            Color color = parseColor(block.color(), colorIdx++);

            if (block.manual()) {
                if (block.manualDay() != null && block.manualStartTime() != null && block.manualEndTime() != null) {
                    int startH = block.manualStartTime().getHour();
                    int endH   = block.manualEndTime().getHour()
                            + (block.manualEndTime().getMinute() > 0 ? 1 : 0);
                    String label = block.manualLabel() != null ? block.manualLabel() : "Manual";
                    slots.add(new RenderSlot(block.manualDay(), startH, endH, label, color));
                }
            } else if (block.groupId() != null) {
                subjectGroupRepository.findById(block.groupId()).ifPresent(group -> {
                    String label = group.getSubject().getNombre() + "\n" + group.getGrupoCode();
                    for (TimeBlock tb : group.getHorarios()) {
                        slots.add(new RenderSlot(tb.getDia().name(), tb.getHoraInicio(), tb.getHoraFin(), label, color));
                    }
                });
            }
        }
        return slots;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void drawWrappedText(Graphics2D g, String text, int x, int y, int maxW, int maxH) {
        FontMetrics fm = g.getFontMetrics();
        int lineH = fm.getHeight();
        int currentY = y;
        for (String line : text.split("\n")) {
            if (currentY > y + maxH) break;
            while (fm.stringWidth(line) > maxW && line.length() > 4) {
                line = line.substring(0, line.length() - 4) + "…";
            }
            g.drawString(line, x, currentY);
            currentY += lineH;
        }
    }

    private Color parseColor(String hex, int idx) {
        if (hex != null && !hex.isBlank()) {
            try {
                String clean = hex.startsWith("#") ? hex.substring(1) : hex;
                return new Color(Integer.parseInt(clean, 16));
            } catch (NumberFormatException ignored) {}
        }
        return PALETTE[idx % PALETTE.length];
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getUserId(),
                schedule.getName(),
                schedule.getSemester(),
                schedule.getNotes(),
                schedule.getTotalCredits(),
                schedule.isArchived(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt(),
                schedule.getBlocks().stream().map(this::toBlockResponse).toList()
        );
    }

    private ScheduleBlockResponse toBlockResponse(ScheduleBlock block) {
        return new ScheduleBlockResponse(
                block.getId(),
                block.getGroupId(),
                block.getSubjectId(),
                block.getColor(),
                block.isManual(),
                block.getManualLabel(),
                block.getManualDay() != null ? block.getManualDay().name() : null,
                block.getManualStartTime(),
                block.getManualEndTime()
        );
    }

    // ── Inner record ──────────────────────────────────────────────────────────

    private record RenderSlot(String dayName, int startHour, int endHour, String label, Color color) {}
}
