package com.travelsphere.entity;

import com.travelsphere.entity.enums.PackageTier;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "packages")
public class TravelPackage extends BaseEntity {

    @Column(name = "uuid", length = 36, nullable = false, unique = true, updatable = false)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id", nullable = false)
    private Destination destination;

    @Column(name = "title", length = 150, nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", length = 30, nullable = false)
    private PackageTier tier = PackageTier.SILVER;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "duration_nights", nullable = false)
    private Integer durationNights;

    @Column(name = "base_price_per_person", precision = 10, scale = 2, nullable = false)
    private BigDecimal basePricePerPerson;

    @Column(name = "hero_image_url", length = 500, nullable = false)
    private String heroImageUrl;

    @Column(name = "inclusions", columnDefinition = "TEXT", nullable = false)
    private String inclusions;

    @Column(name = "exclusions", columnDefinition = "TEXT", nullable = false)
    private String exclusions;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "travelPackage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PackageItem> packageItems = new ArrayList<>();

    public TravelPackage() {}

    @PrePersist
    public void prePersist() {
        if (this.uuid == null || this.uuid.isBlank()) {
            this.uuid = UUID.randomUUID().toString();
        }
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public Destination getDestination() {
        return destination;
    }

    public void setDestination(Destination destination) {
        this.destination = destination;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public PackageTier getTier() {
        return tier;
    }

    public void setTier(PackageTier tier) {
        this.tier = tier;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public Integer getDurationNights() {
        return durationNights;
    }

    public void setDurationNights(Integer durationNights) {
        this.durationNights = durationNights;
    }

    public BigDecimal getBasePricePerPerson() {
        return basePricePerPerson;
    }

    public void setBasePricePerPerson(BigDecimal basePricePerPerson) {
        this.basePricePerPerson = basePricePerPerson;
    }

    public String getHeroImageUrl() {
        return heroImageUrl;
    }

    public void setHeroImageUrl(String heroImageUrl) {
        this.heroImageUrl = heroImageUrl;
    }

    public String getInclusions() {
        return inclusions;
    }

    public void setInclusions(String inclusions) {
        this.inclusions = inclusions;
    }

    public String getExclusions() {
        return exclusions;
    }

    public void setExclusions(String exclusions) {
        this.exclusions = exclusions;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<PackageItem> getPackageItems() {
        return packageItems;
    }

    public void setPackageItems(List<PackageItem> packageItems) {
        this.packageItems = packageItems;
    }
}
