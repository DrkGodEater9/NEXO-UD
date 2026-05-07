package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CreateCampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.entity.Campus;
import com.kumorai.nexo.campus.exception.CampusNotFoundException;
import com.kumorai.nexo.campus.exception.CampusAlreadyExistsException;
import com.kumorai.nexo.campus.mapper.CampusMapper;
import com.kumorai.nexo.campus.repository.CampusRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias para CampusServiceImpl.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CampusServiceImpl - Pruebas Unitarias")
class CampusServiceImplTest {

    @Mock
    private CampusRepository campusRepository;

    @Mock
    private CampusMapper campusMapper;

    @InjectMocks
    private CampusServiceImpl campusService;

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private Campus campusPrincipal;
    private Campus campusNorte;
    private CampusResponse campusResponsePrincipal;

    @BeforeEach
    void setUp() {
        campusPrincipal = Campus.builder()
                .id(1L)
                .nombre("Campus Central")
                .ciudad("Bogotá")
                .direccion("Calle 123 # 45-67")
                .activo(true)
                .build();

        campusNorte = Campus.builder()
                .id(2L)
                .nombre("Campus Norte")
                .ciudad("Bogotá")
                .direccion("Carrera 15 # 100-22")
                .activo(true)
                .build();

        campusResponsePrincipal = CampusResponse.builder()
                .id(1L)
                .nombre("Campus Central")
                .ciudad("Bogotá")
                .build();
    }

    // ─── findAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findAll()")
    class FindAll {

        @Test
        @DisplayName("Debe retornar todos los campus activos")
        void debeRetornarTodosLosCampusActivos() {
            when(campusRepository.findAllByActivoTrue())
                    .thenReturn(List.of(campusPrincipal, campusNorte));
            when(campusMapper.toResponse(any())).thenReturn(campusResponsePrincipal);

            List<CampusResponse> result = campusService.findAllActivos();

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay campus registrados")
        void debeRetornarListaVacia_cuandoNoCampus() {
            when(campusRepository.findAllByActivoTrue()).thenReturn(List.of());

            assertThat(campusService.findAllActivos()).isEmpty();
        }
    }

    // ─── findById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findById()")
    class FindById {

        @Test
        @DisplayName("Debe retornar el campus cuando existe")
        void debeRetornarCampus_cuandoIdExiste() {
            when(campusRepository.findById(1L)).thenReturn(Optional.of(campusPrincipal));
            when(campusMapper.toResponse(campusPrincipal)).thenReturn(campusResponsePrincipal);

            CampusResponse result = campusService.findById(1L);

            assertThat(result.getNombre()).isEqualTo("Campus Central");
        }

        @Test
        @DisplayName("Debe lanzar CampusNotFoundException cuando el ID no existe")
        void debeLanzarExcepcion_cuandoIdNoExiste() {
            when(campusRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campusService.findById(99L))
                    .isInstanceOf(CampusNotFoundException.class);
        }
    }

    // ─── createCampus ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("createCampus()")
    class CreateCampus {

        @Test
        @DisplayName("Debe crear el campus cuando el nombre no está duplicado")
        void debeCrearCampus_cuandoNombreEsUnico() {
            CreateCampusRequest request = CreateCampusRequest.builder()
                    .nombre("Campus Sur")
                    .ciudad("Bogotá")
                    .direccion("Avenida 68 # 12-34")
                    .build();

            when(campusRepository.existsByNombreIgnoreCase(request.getNombre())).thenReturn(false);
            when(campusRepository.save(any())).thenReturn(campusPrincipal);
            when(campusMapper.toResponse(any())).thenReturn(campusResponsePrincipal);

            campusService.createCampus(request);

            verify(campusRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("Debe lanzar CampusAlreadyExistsException cuando el nombre ya existe")
        void debeLanzarExcepcion_cuandoNombreDuplicado() {
            CreateCampusRequest request = CreateCampusRequest.builder()
                    .nombre("Campus Central")
                    .ciudad("Bogotá")
                    .direccion("Otra dirección")
                    .build();

            when(campusRepository.existsByNombreIgnoreCase("Campus Central")).thenReturn(true);

            assertThatThrownBy(() -> campusService.createCampus(request))
                    .isInstanceOf(CampusAlreadyExistsException.class);

            verify(campusRepository, never()).save(any());
        }

        @Test
        @DisplayName("El campus nuevo debe quedar activo por defecto")
        void debeQuedarActivo_alCrearse() {
            CreateCampusRequest request = CreateCampusRequest.builder()
                    .nombre("Campus Sur")
                    .ciudad("Cali")
                    .direccion("Calle 5 # 10-20")
                    .build();

            when(campusRepository.existsByNombreIgnoreCase(anyString())).thenReturn(false);
            when(campusRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(campusMapper.toResponse(any())).thenReturn(campusResponsePrincipal);

            campusService.createCampus(request);

            verify(campusRepository).save(argThat(Campus::isActivo));
        }
    }

    // ─── deleteCampus (soft delete) ───────────────────────────────────────────

    @Nested
    @DisplayName("deleteCampus() - Soft Delete")
    class DeleteCampus {

        @Test
        @DisplayName("Debe desactivar el campus en lugar de eliminarlo físicamente")
        void debeDesactivarCampus_enLugarDeEliminar() {
            when(campusRepository.findById(1L)).thenReturn(Optional.of(campusPrincipal));
            when(campusRepository.save(any())).thenReturn(campusPrincipal);

            campusService.deleteCampus(1L);

            verify(campusRepository).save(argThat(c -> !c.isActivo()));
            verify(campusRepository, never()).deleteById(anyLong());
        }

        @Test
        @DisplayName("Debe lanzar CampusNotFoundException al eliminar un campus inexistente")
        void debeLanzarExcepcion_cuandoNoeExisteAlEliminar() {
            when(campusRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campusService.deleteCampus(99L))
                    .isInstanceOf(CampusNotFoundException.class);
        }
    }
}
