package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.WelfareContentRequest;
import com.kumorai.nexo.content.dto.WelfareContentResponse;
import com.kumorai.nexo.content.entity.WelfareCategory;
import com.kumorai.nexo.content.entity.WelfareContent;
import com.kumorai.nexo.content.repository.WelfareContentRepository;
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
@DisplayName("WelfareServiceImpl - Pruebas Unitarias")
class WelfareServiceImplTest {

    @Mock
    private WelfareContentRepository welfareContentRepository;

    @InjectMocks
    private WelfareServiceImpl welfareService;

    private WelfareContent contenido;
    private WelfareContentRequest request;

    @BeforeEach
    void setUp() {
        contenido = WelfareContent.builder()
                .id(1L)
                .title("Beca de alimentación")
                .shortDescription("Resumen corto")
                .description("Descripción completa del programa")
                .category(WelfareCategory.APOYO_ALIMENTARIO)
                .links("https://bienestar.ud.edu.co")
                .images(null)
                .createdBy(4L)
                .createdAt(LocalDateTime.now())
                .build();

        request = new WelfareContentRequest(
                "Salud mental",
                "Apoyo psicológico",
                "Descripción larga del servicio",
                WelfareCategory.SALUD_MENTAL,
                null,
                null
        );
    }

    // ─── listAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listAll()")
    class ListAll {

        @Test
        @DisplayName("Debe retornar todos los contenidos cuando category es null")
        void debeRetornarTodos_cuandoCategoryEsNull() {
            when(welfareContentRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(contenido));

            List<WelfareContentResponse> result = welfareService.listAll(null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).title()).isEqualTo("Beca de alimentación");
            verify(welfareContentRepository).findAllByOrderByCreatedAtDesc();
            verify(welfareContentRepository, never()).findByCategoryOrderByCreatedAtDesc(any());
        }

        @Test
        @DisplayName("Debe filtrar por categoría cuando se proporciona")
        void debeFiltrarPorCategoria_cuandoSeIndica() {
            when(welfareContentRepository.findByCategoryOrderByCreatedAtDesc(WelfareCategory.APOYO_ALIMENTARIO))
                    .thenReturn(List.of(contenido));

            List<WelfareContentResponse> result = welfareService.listAll(WelfareCategory.APOYO_ALIMENTARIO);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).category()).isEqualTo("APOYO_ALIMENTARIO");
            verify(welfareContentRepository).findByCategoryOrderByCreatedAtDesc(WelfareCategory.APOYO_ALIMENTARIO);
            verify(welfareContentRepository, never()).findAllByOrderByCreatedAtDesc();
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay contenidos")
        void debeRetornarListaVacia_cuandoNoHayContenidos() {
            when(welfareContentRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

            List<WelfareContentResponse> result = welfareService.listAll(null);

            assertThat(result).isEmpty();
        }
    }

    // ─── getById ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Debe retornar el contenido cuando el ID existe")
        void debeRetornarContenido_cuandoIdExiste() {
            when(welfareContentRepository.findById(1L)).thenReturn(Optional.of(contenido));

            WelfareContentResponse result = welfareService.getById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.title()).isEqualTo("Beca de alimentación");
            assertThat(result.category()).isEqualTo("APOYO_ALIMENTARIO");
            assertThat(result.createdBy()).isEqualTo(4L);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(welfareContentRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> welfareService.getById(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("Contenido de bienestar no encontrado");
        }
    }

    // ─── create ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Debe crear el contenido con todos los campos del request")
        void debeCrearContenido_conTodosLosCampos() {
            WelfareContent saved = WelfareContent.builder()
                    .id(2L).title("Salud mental").shortDescription("Apoyo psicológico")
                    .description("Descripción larga del servicio")
                    .category(WelfareCategory.SALUD_MENTAL)
                    .createdBy(4L).createdAt(LocalDateTime.now()).build();
            when(welfareContentRepository.save(any(WelfareContent.class))).thenReturn(saved);

            WelfareContentResponse result = welfareService.create(request, 4L);

            assertThat(result.title()).isEqualTo("Salud mental");
            assertThat(result.category()).isEqualTo("SALUD_MENTAL");
            assertThat(result.createdBy()).isEqualTo(4L);
        }

        @Test
        @DisplayName("Debe asignar el createdBy con el userId proporcionado")
        void debeAsignarCreatedBy() {
            when(welfareContentRepository.save(any(WelfareContent.class))).thenAnswer(inv -> inv.getArgument(0));

            welfareService.create(request, 55L);

            verify(welfareContentRepository).save(argThat(c -> c.getCreatedBy().equals(55L)));
        }
    }

    // ─── update ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Debe actualizar todos los campos del contenido")
        void debeActualizarCampos_cuandoExiste() {
            when(welfareContentRepository.findById(1L)).thenReturn(Optional.of(contenido));
            when(welfareContentRepository.save(any(WelfareContent.class))).thenAnswer(inv -> inv.getArgument(0));

            WelfareContentResponse result = welfareService.update(1L, request);

            assertThat(result.title()).isEqualTo("Salud mental");
            assertThat(result.shortDescription()).isEqualTo("Apoyo psicológico");
            assertThat(result.category()).isEqualTo("SALUD_MENTAL");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el contenido no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(welfareContentRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> welfareService.update(99L, request))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(welfareContentRepository, never()).save(any());
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe eliminar el contenido cuando existe")
        void debeEliminarContenido_cuandoExiste() {
            when(welfareContentRepository.findById(1L)).thenReturn(Optional.of(contenido));

            welfareService.delete(1L);

            verify(welfareContentRepository, times(1)).delete(contenido);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando el contenido no existe")
        void debeLanzarExcepcion_cuandoNoExiste() {
            when(welfareContentRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> welfareService.delete(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(welfareContentRepository, never()).delete(any());
        }
    }
}
