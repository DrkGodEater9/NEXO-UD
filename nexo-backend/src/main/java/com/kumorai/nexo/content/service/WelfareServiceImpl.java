package com.kumorai.nexo.content.service;

import com.kumorai.nexo.content.dto.WelfareContentRequest;
import com.kumorai.nexo.content.dto.WelfareContentResponse;
import com.kumorai.nexo.content.entity.WelfareCategory;
import com.kumorai.nexo.content.entity.WelfareContent;
import com.kumorai.nexo.content.repository.WelfareContentRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WelfareServiceImpl implements WelfareService {

    private final WelfareContentRepository welfareContentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<WelfareContentResponse> listAll(WelfareCategory category) {
        if (category != null) {
            return welfareContentRepository.findByCategoryOrderByCreatedAtDesc(category)
                    .stream().map(this::toResponse).toList();
        }
        return welfareContentRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WelfareContentResponse getById(Long id) {
        return toResponse(find(id));
    }

    @Override
    @Transactional
    public WelfareContentResponse create(WelfareContentRequest request, Long createdBy) {
        WelfareContent content = WelfareContent.builder()
                .title(request.title())
                .shortDescription(request.shortDescription())
                .description(request.description())
                .category(request.category())
                .links(request.links())
                .images(request.images())
                .createdBy(createdBy)
                .build();
        return toResponse(welfareContentRepository.save(content));
    }

    @Override
    @Transactional
    public WelfareContentResponse update(Long id, WelfareContentRequest request) {
        WelfareContent content = find(id);
        content.setTitle(request.title());
        content.setShortDescription(request.shortDescription());
        content.setDescription(request.description());
        content.setCategory(request.category());
        content.setLinks(request.links());
        content.setImages(request.images());
        return toResponse(welfareContentRepository.save(content));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        welfareContentRepository.delete(find(id));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private WelfareContent find(Long id) {
        return welfareContentRepository.findById(id)
                .orElseThrow(() -> NexoException.notFound("Contenido de bienestar no encontrado"));
    }

    private WelfareContentResponse toResponse(WelfareContent c) {
        return new WelfareContentResponse(
                c.getId(),
                c.getTitle(),
                c.getShortDescription(),
                c.getDescription(),
                c.getCategory().name(),
                c.getLinks(),
                c.getImages(),
                c.getCreatedBy(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
