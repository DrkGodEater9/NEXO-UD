package com.kumorai.nexo.campus.service;

import com.kumorai.nexo.campus.dto.CampusRequest;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomRequest;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.campus.entity.Campus;
import com.kumorai.nexo.campus.entity.Classroom;
import com.kumorai.nexo.campus.entity.ClassroomPhoto;
import com.kumorai.nexo.campus.repository.CampusRepository;
import com.kumorai.nexo.campus.repository.ClassroomPhotoRepository;
import com.kumorai.nexo.campus.repository.ClassroomRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampusServiceImpl - Pruebas Unitarias")
class CampusServiceImplTest {

    @Mock private CampusRepository campusRepository;
    @Mock private ClassroomRepository classroomRepository;
    @Mock private ClassroomPhotoRepository photoRepository;

    @InjectMocks private CampusServiceImpl campusService;

    private Campus campus;
    private Classroom classroom;

    @BeforeEach
    void setUp() {
        campus = Campus.builder()
                .id(1L)
                .name("Ingenieria")
                .address("Cra 8")
                .faculty("INGENIERIA")
                .latitude(4.0)
                .longitude(-74.0)
                .mapUrl("map")
                .classrooms(new ArrayList<>())
                .build();
        classroom = Classroom.builder()
                .id(2L)
                .name("Lab 1")
                .building("A")
                .floor("2")
                .isLab(true)
                .campus(campus)
                .photos(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("campus CRUD")
    class CampusCrud {

        @Test
        @DisplayName("Debe listar todas las sedes sin filtro")
        void debeListarSinFiltro() {
            when(campusRepository.findAllByOrderByFacultyAscNameAsc()).thenReturn(List.of(campus));

            List<CampusResponse> result = campusService.listAll(null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Ingenieria");
        }

        @Test
        @DisplayName("Debe listar sedes por facultad")
        void debeListarPorFacultad() {
            when(campusRepository.findByFacultyOrderByNameAsc("INGENIERIA")).thenReturn(List.of(campus));

            List<CampusResponse> result = campusService.listAll("INGENIERIA");

            assertThat(result).hasSize(1);
            verify(campusRepository).findByFacultyOrderByNameAsc("INGENIERIA");
        }

        @Test
        @DisplayName("Debe retornar sede por ID")
        void debeRetornarPorId() {
            when(campusRepository.findById(1L)).thenReturn(Optional.of(campus));

            CampusResponse result = campusService.getById(1L);

            assertThat(result.id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Debe lanzar not found cuando la sede no existe")
        void debeLanzarNotFound() {
            when(campusRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> campusService.getById(99L)).isInstanceOf(NexoException.class);
        }

        @Test
        @DisplayName("Debe crear sede")
        void debeCrearSede() {
            CampusRequest request = new CampusRequest("Nueva", "Dir", "ARTES", 4.1, -74.1, "map2");
            when(campusRepository.save(any(Campus.class))).thenAnswer(invocation -> {
                Campus saved = invocation.getArgument(0);
                saved.setId(10L);
                return saved;
            });

            CampusResponse result = campusService.create(request);

            assertThat(result.id()).isEqualTo(10L);
            assertThat(result.name()).isEqualTo("Nueva");
        }

        @Test
        @DisplayName("Debe eliminar sede existente")
        void debeEliminarSede() {
            when(campusRepository.existsById(1L)).thenReturn(true);

            campusService.delete(1L);

            verify(campusRepository).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("classrooms y photos")
    class Classrooms {

        @Test
        @DisplayName("Debe listar salones de una sede")
        void debeListarSalones() {
            when(campusRepository.existsById(1L)).thenReturn(true);
            when(classroomRepository.findByCampusId(1L)).thenReturn(List.of(classroom));

            List<ClassroomResponse> result = campusService.listClassrooms(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Lab 1");
        }

        @Test
        @DisplayName("Debe agregar salon")
        void debeAgregarSalon() {
            when(campusRepository.findById(1L)).thenReturn(Optional.of(campus));
            when(classroomRepository.save(any(Classroom.class))).thenReturn(classroom);

            ClassroomResponse result = campusService.addClassroom(1L, new ClassroomRequest("Lab 1", "A", "2", true));

            assertThat(result.isLab()).isTrue();
            verify(classroomRepository).save(any(Classroom.class));
        }

        @Test
        @DisplayName("Debe agregar foto al salon")
        void debeAgregarFoto() {
            classroom.getPhotos().add(ClassroomPhoto.builder().id(5L).photoUrl("/uploads/a.png").uploadedBy(1L).classroom(classroom).build());
            when(classroomRepository.findByIdAndCampusId(2L, 1L)).thenReturn(Optional.of(classroom));
            when(classroomRepository.findById(2L)).thenReturn(Optional.of(classroom));

            ClassroomResponse result = campusService.addPhoto(1L, 2L, "/uploads/a.png", 1L);

            assertThat(result.photoUrls()).contains("/uploads/a.png");
            verify(photoRepository).save(any(ClassroomPhoto.class));
        }

        @Test
        @DisplayName("Debe eliminar foto existente")
        void debeEliminarFoto() {
            ClassroomPhoto photo = ClassroomPhoto.builder().id(5L).photoUrl("/uploads/a.png").uploadedBy(1L).classroom(classroom).build();
            when(classroomRepository.findByIdAndCampusId(2L, 1L)).thenReturn(Optional.of(classroom));
            when(photoRepository.findByIdAndClassroomId(5L, 2L)).thenReturn(Optional.of(photo));

            campusService.deletePhoto(1L, 2L, 5L);

            verify(photoRepository).delete(photo);
        }
    }
}
