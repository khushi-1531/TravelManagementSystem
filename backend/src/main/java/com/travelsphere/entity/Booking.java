package com.travelsphere.entity;

import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.BookingType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Entity
@Table(name = "bookings")
public class Booking extends BaseEntity {

    @Column(name = "booking_reference", length = 15, nullable = false, unique = true, updatable = false)
    private String bookingReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_type", length = 20, nullable = false)
    private BookingType bookingType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "currency", length = 5)
    private String currency = "INR";

    @Column(name = "customer_notes", columnDefinition = "TEXT")
    private String customerNotes;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HotelBookingItem> hotelBookingItems = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PackageBookingItem> packageBookingItems = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PaymentAttempt> paymentAttempts = new ArrayList<>();

    public Booking() {}

    @PrePersist
    public void prePersist() {
        if (this.bookingReference == null || this.bookingReference.isBlank()) {
            this.bookingReference = "TS-" + (100000 + new Random().nextInt(900000));
        }
    }

    public void addHotelBookingItem(HotelBookingItem item) {
        hotelBookingItems.add(item);
        item.setBooking(this);
    }

    public void addPackageBookingItem(PackageBookingItem item) {
        packageBookingItems.add(item);
        item.setBooking(this);
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public void setBookingReference(String bookingReference) {
        this.bookingReference = bookingReference;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BookingType getBookingType() {
        return bookingType;
    }

    public void setBookingType(BookingType bookingType) {
        this.bookingType = bookingType;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCustomerNotes() {
        return customerNotes;
    }

    public void setCustomerNotes(String customerNotes) {
        this.customerNotes = customerNotes;
    }

    public List<HotelBookingItem> getHotelBookingItems() {
        return hotelBookingItems;
    }

    public void setHotelBookingItems(List<HotelBookingItem> hotelBookingItems) {
        this.hotelBookingItems = hotelBookingItems;
    }

    public List<PackageBookingItem> getPackageBookingItems() {
        return packageBookingItems;
    }

    public void setPackageBookingItems(List<PackageBookingItem> packageBookingItems) {
        this.packageBookingItems = packageBookingItems;
    }

    public List<PaymentAttempt> getPaymentAttempts() {
        return paymentAttempts;
    }

    public void setPaymentAttempts(List<PaymentAttempt> paymentAttempts) {
        this.paymentAttempts = paymentAttempts;
    }
}
