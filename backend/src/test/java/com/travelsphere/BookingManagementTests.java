package com.travelsphere;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.dto.request.CreateBookingRequest;
import com.travelsphere.dto.response.BookingResponse;
import com.travelsphere.entity.*;
import com.travelsphere.entity.enums.BookingStatus;
import com.travelsphere.entity.enums.BookingType;
import com.travelsphere.entity.enums.RoomType;
import com.travelsphere.entity.enums.UserStatus;
import com.travelsphere.exception.BadRequestException;
import com.travelsphere.exception.ForbiddenException;
import com.travelsphere.repository.*;
import com.travelsphere.security.UserPrincipal;
import com.travelsphere.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingManagementTests {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private HotelBookingItemRepository hotelBookingItemRepository;

    @Mock
    private PackageBookingItemRepository packageBookingItemRepository;

    @Mock
    private TravelPackageRepository travelPackageRepository;

    @Mock
    private HotelRoomRepository hotelRoomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private User otherUser;
    private UserPrincipal testUserPrincipal;
    private UserPrincipal otherUserPrincipal;
    private TravelPackage testPackage;
    private HotelRoom testRoom;
    private Hotel testHotel;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("traveler1");
        testUser.setEmail("traveler1@example.com");
        testUser.setFullName("Traveler One");
        testUser.setStatus(UserStatus.ACTIVE);

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("traveler2");
        otherUser.setEmail("traveler2@example.com");

        testUserPrincipal = UserPrincipal.builder()
                .id(1L)
                .username("traveler1")
                .email("traveler1@example.com")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        otherUserPrincipal = UserPrincipal.builder()
                .id(2L)
                .username("traveler2")
                .email("traveler2@example.com")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        testPackage = new TravelPackage();
        testPackage.setId(10L);
        testPackage.setTitle("Goa Sun & Sand");
        testPackage.setBasePricePerPerson(BigDecimal.valueOf(15000.00));
        testPackage.setIsActive(true);

        testHotel = new Hotel();
        testHotel.setId(20L);
        testHotel.setName("Grand Palace Resort");

        testRoom = new HotelRoom();
        testRoom.setId(30L);
        testRoom.setHotel(testHotel);
        testRoom.setRoomType(RoomType.DELUXE);
        testRoom.setPricePerNight(BigDecimal.valueOf(4500.00));
        testRoom.setTotalInventory(5);
        testRoom.setMaxOccupancy(2);
        testRoom.setIsActive(true);
    }

    @Test
    @DisplayName("Should successfully create package booking with server-calculated price")
    void createPackageBooking_Success() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .bookingType(BookingType.PACKAGE)
                .packageId(10L)
                .startDate(LocalDate.now().plusDays(5))
                .guestsCount(2)
                .customerNotes("Window seats preferred")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(travelPackageRepository.findByIdAndIsActiveTrue(10L)).thenReturn(Optional.of(testPackage));
        when(bookingRepository.existsByBookingReference(any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(100L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals(BookingType.PACKAGE.name(), response.getBookingType());
        assertEquals(BookingStatus.PENDING.name(), response.getStatus());
        assertEquals(BigDecimal.valueOf(30000.00), response.getTotalAmount()); // 15000 * 2
        assertEquals("UNPAID", response.getPaymentStatus());
        assertNotNull(response.getBookingReference());
        assertTrue(response.getBookingReference().startsWith("TS-"));
    }

    @Test
    @DisplayName("Should reject package booking with past travel date")
    void createPackageBooking_PastDate_ThrowsBadRequest() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .bookingType(BookingType.PACKAGE)
                .packageId(10L)
                .startDate(LocalDate.now().minusDays(1))
                .guestsCount(2)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(request, testUserPrincipal));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully create hotel room booking with availability validation")
    void createHotelBooking_Success() {
        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = LocalDate.now().plusDays(13); // 3 nights

        CreateBookingRequest request = CreateBookingRequest.builder()
                .bookingType(BookingType.HOTEL)
                .hotelRoomId(30L)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .roomsCount(1)
                .guestsCount(2)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(hotelRoomRepository.findByIdWithLock(30L)).thenReturn(Optional.of(testRoom));
        when(hotelBookingItemRepository.countBookedRooms(eq(30L), eq(checkIn), eq(checkOut))).thenReturn(2L); // 2 out of 5 booked
        when(bookingRepository.existsByBookingReference(any())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(200L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, testUserPrincipal);

        assertNotNull(response);
        assertEquals(BookingType.HOTEL.name(), response.getBookingType());
        // 3 nights * 1 room * 4500 = 13500.00
        assertEquals(BigDecimal.valueOf(13500.00), response.getTotalAmount());
    }

    @Test
    @DisplayName("Should reject hotel booking when check-out date is not after check-in")
    void createHotelBooking_InvalidDates_ThrowsBadRequest() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .bookingType(BookingType.HOTEL)
                .hotelRoomId(30L)
                .checkInDate(LocalDate.now().plusDays(5))
                .checkOutDate(LocalDate.now().plusDays(4)) // before check-in
                .roomsCount(1)
                .guestsCount(1)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(request, testUserPrincipal));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject hotel booking when room inventory is fully exhausted")
    void createHotelBooking_Overbooking_ThrowsBadRequest() {
        LocalDate checkIn = LocalDate.now().plusDays(2);
        LocalDate checkOut = LocalDate.now().plusDays(4);

        CreateBookingRequest request = CreateBookingRequest.builder()
                .bookingType(BookingType.HOTEL)
                .hotelRoomId(30L)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .roomsCount(2)
                .guestsCount(2)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(hotelRoomRepository.findByIdWithLock(30L)).thenReturn(Optional.of(testRoom));
        // Already 4 rooms booked out of 5, requesting 2 more
        when(hotelBookingItemRepository.countBookedRooms(eq(30L), eq(checkIn), eq(checkOut))).thenReturn(4L);

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(request, testUserPrincipal));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should enforce ownership when accessing booking details")
    void getBookingDetails_OwnershipEnforced() {
        Booking booking = new Booking();
        booking.setId(500L);
        booking.setUser(testUser);
        booking.setBookingReference("TS-888999");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setTotalAmount(BigDecimal.valueOf(10000));

        when(bookingRepository.findById(500L)).thenReturn(Optional.of(booking));

        // Test owner access -> OK
        BookingResponse ownerResponse = bookingService.getBookingDetails(500L, testUserPrincipal);
        assertNotNull(ownerResponse);
        assertEquals("TS-888999", ownerResponse.getBookingReference());

        // Test non-owner access -> ForbiddenException
        assertThrows(ForbiddenException.class, () -> bookingService.getBookingDetails(500L, otherUserPrincipal));
    }

    @Test
    @DisplayName("Should allow cancelling an eligible booking and prevent double cancellation")
    void cancelBooking_Lifecycle() {
        Booking booking = new Booking();
        booking.setId(600L);
        booking.setUser(testUser);
        booking.setStatus(BookingStatus.PENDING);
        booking.setBookingReference("TS-777111");
        booking.setTotalAmount(BigDecimal.valueOf(5000));

        when(bookingRepository.findById(600L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse cancelled = bookingService.cancelBooking(600L, testUserPrincipal);
        assertEquals(BookingStatus.CANCELLED.name(), cancelled.getStatus());

        // Cancelling again should throw BadRequestException
        assertThrows(BadRequestException.class, () -> bookingService.cancelBooking(600L, testUserPrincipal));
    }
}
