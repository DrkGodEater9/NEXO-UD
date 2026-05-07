package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.AnnouncementRequest;
import com.kumorai.nexo.content.dto.AnnouncementResponse;
import com.kumorai.nexo.content.entity.Announcement;
import com.kumorai.nexo.content.entity.AnnouncementScope;
import com.kumorai.nexo.content.entity.AnnouncementType;
import com.kumorai.nexo.content.repository.AnnouncementRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnnouncementServiceImpl - Pruebas Unitarias")
class AnnouncementServiceImplTest {

    @Mock
    private AnnouncementRepository announcementRepository;

    @InjectMocks
    private AnnouncementServiceImpl announcementService;

    private Announcement aviso;
    private AnnouncementRequest request;

    @BeforeEach
    void setUp() {
        aviso = Announcement.builder()
                .id(1L)
                .title("Aviso importante")
                .body("Cuerpo del aviso")
                .scope(AnnouncementScope.UNIVERSIDAD)
                .type(AnnouncementType.GENERAL)
                .faculty(null)
                .links("https://ejemplo.com")
                .images(null)
                .createdBy(5L)
                .createdAt(LocalDateTime.now())
                .build();

        request = new AnnouncementRequest(
                "Nuevo aviso",
                "Cuerpo nuevo",
                AnnouncementScope.FACULTAD,
                AnnouncementType.ASAMBLEA,
                "Ingeniería",
                null,
                null
        );
    }

    // ─── listAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listAll()")
    class ListAll {

        @Test
        @DisplayName("Debe retornar todos los avisos cuando no se aplican filtros")
        void debeRetornarTodos_sinFiltros() {
            when(announcementRepository.findFiltered(null, null, null)).thenReturn(List.of(aviso));

            List<AnnouncementResponse> result = announcementService.listAll(null, null, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).title()).isEqualTo("Aviso importante");
        }

        @Test
        @DisplayName("Debe delegar filtro de scope al repositorio")
        void debeDelegarFiltroDeScope() {
            when(announcementRepository.findFiltered(AnnouncementScope.UNIVERSIDAD, null, null))
                    .thenReturn(List.of(aviso));

            List<AnnouncementResponse> result = announcementService.listAll(AnnouncementScope.UNIVERSIDAD, null, null);

            assertThat(result).hasSize(1);
            verify(announcementRepository).findFiltered(AnnouncementScope.UNIVERSIDAD, null, null);
        }

        @Test
        @DisplayName("Debe delegar filtro de tipo y facultad al repositorio")
        void debeDelegarFiltrosDeTipoYFacultad() {
            when(announcementRepository.findFiltered(null, AnnouncementType.ASAMBLEA, "Ingeniería"))
                    .thenReturn(List.of());

            List<AnnouncementResponse> result = announcementService.listAll(null, AnnouncementType.ASAMBLEA, "Ingeniería");

            assertThat(result).isEmpty();
            verify(announcementRepository).findFiltered(null, AnnouncementType.ASAMBLEA, "Ingeniería");
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay avisos")
        void debeRetornarListaVacia_cuandoNoHayAvisos() {
            when(announcementRepository.findFiltered(any(), any(), any())).thenReturn(List.of());

            List<AnnouncementResponse> result = announcementService.listAll(null, null, null);

            assertThat(result).isEmpty();
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar el aviso cuando el ID existe")
        void debeRetornarAviso_cuandoIdExiste() {
            when(announcementRepository.findById(1L)).thenReturn(Optional.of(aviso));

            AnnouncementResponse result = announcementService.getById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.title()).isEqualTo("Aviso importante");
            assertThat(result.scope()).isEqualTo("UNIVERSIDAD");
            assertThat(result.type()).isEqualTo("GENERAL");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(announcementRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> announcementService.getById(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Aviso no encontrado");
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Debe crear el aviso con todos los campos del request")
        void debeCrearAviso_conTodosLosCampos() {
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> {
                Announcement a = inv.getArgument(0);
                a = Announcement.builder()
                        .id(2L).title(a.getTitle()).body(a.getBody())
                        .scope(a.getScope()).type(a.getType())
                        .faculty(a.getFaculty()).createdBy(a.getCreatedBy())
                        .createdAt(LocalDateTime.now()).build();
                return a;
            });

            AnnouncementResponse result = announcementService.create(request, 5L);

            assertThat(result.title()).isEqualTo("Nuevo aviso");
            assertThat(result.scope()).isEqualTo("FACULTAD");
            assertThat(result.type()).isEqualTo("ASAMBLEA");
            assertThat(result.faculty()).isEqualTo("Ingeniería");
            assertThat(result.createdBy()).isEqualTo(5L);
        }

        @Test
        @DisplayName("Debe asignar el createdBy con el userId proporcionado")
        void debeAsignarCreatedBy_conUserIdProporcionado() {
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            announcementService.create(request, 99L);

            verify(announcementRepository).save(argThat(a -> a.getCreatedBy().equals(99L)));
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Debe actualizar todos los campos del aviso")
        void debeActualizarCampos_cuandoExiste() {
            when(announcementRepository.findById(1L)).thenReturn(Optional.of(aviso));
            when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

            AnnouncementResponse result = announcementService.update(1L, request);

            assertThat(result.title()).isEqualTo("Nuevo aviso");
            assertThat(result.body()).isEqualTo("Cuerpo nuevo");
            assertThat(result.scope()).isEqualTo("FACULTAD");
            assertThat(result.faculty()).isEqualTo("Ingeniería");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el aviso no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(announcementRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> announcementService.update(99L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(announcementRepository, never()).save(any());
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe eliminar el aviso cuando existe")
        void debeEliminarAviso_cuandoExiste() {
            when(announcementRepository.findById(1L)).thenReturn(Optional.of(aviso));

            announcementService.delete(1L);

            verify(announcementRepository, times(1)).delete(aviso);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el aviso no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(announcementRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> announcementService.delete(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(announcementRepository, never()).delete(any());
        }
    }
}
