package com.travelsphere.entity;

import com.travelsphere.entity.enums.RoomType;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "hotel_rooms")
public class HotelRoom extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", length = 30, nullable = false)
    private RoomType roomType;

    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy = 2;

    @Column(name = "has_ac")
    private Boolean hasAc = true;

    @Column(name = "is_breakfast_included")
    private Boolean isBreakfastIncluded = false;

    @Column(name = "price_per_night", precision = 10, scale = 2, nullable = false)
    private BigDecimal pricePerNight;

    @Column(name = "total_inventory", nullable = false)
    private Integer totalInventory = 10;

    @Column(name = "available_inventory", nullable = false)
    private Integer availableInventory = 10;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public HotelRoom() {}

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Hotel getHotel() {
        return hotel;
    }

    public void setHotel(Hotel hotel) {
        this.hotel = hotel;
    }

    public RoomType getRoomType() {
        return roomType;
    }

    public void setRoomType(RoomType roomType) {
        this.roomType = roomType;
    }

    public Integer getMaxOccupancy() {
        return maxOccupancy;
    }

    public void setMaxOccupancy(Integer maxOccupancy) {
        this.maxOccupancy = maxOccupancy;
    }

    public Boolean getHasAc() {
        return hasAc;
    }

    public void setHasAc(Boolean hasAc) {
        this.hasAc = hasAc;
    }

    public Boolean getIsBreakfastIncluded() {
        return isBreakfastIncluded;
    }

    public void setIsBreakfastIncluded(Boolean isBreakfastIncluded) {
        this.isBreakfastIncluded = isBreakfastIncluded;
    }

    public BigDecimal getPricePerNight() {
        return pricePerNight;
    }

    public void setPricePerNight(BigDecimal pricePerNight) {
        this.pricePerNight = pricePerNight;
    }

    public Integer getTotalInventory() {
        return totalInventory;
    }

    public void setTotalInventory(Integer totalInventory) {
        this.totalInventory = totalInventory;
    }

    public Integer getAvailableInventory() {
        return availableInventory;
    }

    public void setAvailableInventory(Integer availableInventory) {
        this.availableInventory = availableInventory;
    }
}
