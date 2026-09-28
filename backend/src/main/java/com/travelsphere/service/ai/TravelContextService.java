package com.travelsphere.service.ai;

import com.travelsphere.dto.response.ChatAction;
import com.travelsphere.entity.Booking;
import com.travelsphere.entity.Destination;
import com.travelsphere.entity.Hotel;
import com.travelsphere.entity.TravelPackage;
import com.travelsphere.repository.BookingRepository;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.TravelPackageRepository;
import com.travelsphere.security.UserPrincipal;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service that extracts concise, database-grounded TravelSphere context based on query intent.
 * Enforces strict booking privacy: customers can only view their own reservations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TravelContextService {

    private final DestinationRepository destinationRepository;
    private final TravelPackageRepository travelPackageRepository;
    private final HotelRepository hotelRepository;
    private final BookingRepository bookingRepository;

    @Data
    @Builder
    public static class ContextBundle {
        private String systemPrompt;
        private List<ChatAction> actions;
        private List<String> suggestedPrompts;
    }

    /**
     * Build grounded system context, navigation action links, and suggested next prompts.
     */
    public ContextBundle buildContext(String userPrompt, UserPrincipal currentUser, Long destinationId) {
        StringBuilder sb = new StringBuilder();
        List<ChatAction> actions = new ArrayList<>();
        List<String> suggestedPrompts = new ArrayList<>();

        sb.append("You are the official TravelSphere AI Travel Assistant. ");
        sb.append("Your mission is to provide helpful, accurate, and concise travel planning advice. ");
        sb.append("CRITICAL INSTRUCTIONS:\n");
        sb.append("1. PRIORITIZE AUTHORITATIVE TRAVELSPHERE DATA PROVIDED BELOW over generic knowledge.\n");
        sb.append("2. NEVER invent package titles, hotel names, room availability, prices, or booking references not present in the database.\n");
        sb.append("3. If TravelSphere does not offer the requested item, state honestly that it's not in our catalogue.\n");
        sb.append("4. Clearly distinguish TravelSphere catalogue facts from general travel advice.\n");
        sb.append("5. Maintain customer privacy; never disclose private details or API keys.\n\n");
        sb.append("==== AUTHORITATIVE TRAVELSPHERE DATABASE RECORDS ====\n");

        String lowerPrompt = (userPrompt != null) ? userPrompt.toLowerCase() : "";

        // Detect booking intent
        boolean hasBookingIntent = lowerPrompt.contains("booking") || lowerPrompt.contains("reservation")
                || lowerPrompt.contains("my trip") || lowerPrompt.contains("my tour") || lowerPrompt.contains("status");

        if (hasBookingIntent) {
            if (currentUser != null) {
                // Strictly fetch authenticated user's own bookings
                List<Booking> userBookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
                if (!userBookings.isEmpty()) {
                    sb.append("AUTHENTICATED CUSTOMER ACTIVE BOOKINGS:\n");
                    int count = Math.min(userBookings.size(), 3);
                    for (int i = 0; i < count; i++) {
                        Booking b = userBookings.get(i);
                        sb.append(String.format("- Ref: %s | Type: %s | Status: %s | Amount: %s %s\n",
                                b.getBookingReference(),
                                b.getBookingType(),
                                b.getStatus(),
                                b.getTotalAmount(),
                                b.getCurrency() != null ? b.getCurrency() : "INR"));
                    }
                    actions.add(ChatAction.builder()
                            .type("BOOKING")
                            .label("View My Bookings")
                            .url("/bookings")
                            .build());
                } else {
                    sb.append("AUTHENTICATED CUSTOMER: No authenticated customer active bookings found.\n");
                }
            } else {
                sb.append("USER AUTHENTICATION STATUS: Unauthenticated visitor. Instruct user to sign in to check their booking details.\n");
            }
        }

        // Fetch Packages
        boolean hasPackageIntent = lowerPrompt.contains("package") || lowerPrompt.contains("tour")
                || lowerPrompt.contains("trip") || lowerPrompt.contains("itinerary") || lowerPrompt.contains("budget")
                || lowerPrompt.contains("plan");

        List<TravelPackage> packages = travelPackageRepository.findByIsActiveTrue(PageRequest.of(0, 5)).getContent();
        if (!packages.isEmpty()) {
            sb.append("\nAVAILABLE TRAVEL PACKAGES:\n");
            for (TravelPackage pkg : packages) {
                String destName = (pkg.getDestination() != null) ? pkg.getDestination().getName() : "Multi-City";
                sb.append(String.format("- ID %d: '%s' (%s) | %d Days / %d Nights | Tier: %s | Price: ₹%s/person\n",
                        pkg.getId(),
                        pkg.getTitle(),
                        destName,
                        pkg.getDurationDays(),
                        pkg.getDurationNights(),
                        pkg.getTier(),
                        pkg.getBasePricePerPerson()));

                if (hasPackageIntent && actions.size() < 3) {
                    actions.add(ChatAction.builder()
                            .type("PACKAGE")
                            .label("View: " + pkg.getTitle())
                            .url("/packages/" + pkg.getId())
                            .entityId(pkg.getId())
                            .build());
                }
            }
        }

        // Fetch Hotels
        boolean hasHotelIntent = lowerPrompt.contains("hotel") || lowerPrompt.contains("room")
                || lowerPrompt.contains("stay") || lowerPrompt.contains("resort") || lowerPrompt.contains("accommodation");

        List<Hotel> hotels = hotelRepository.findByIsActiveTrue(PageRequest.of(0, 4)).getContent();
        if (!hotels.isEmpty()) {
            sb.append("\nFEATURED HOTELS & ACCOMMODATIONS:\n");
            for (Hotel h : hotels) {
                String dest = (h.getDestination() != null) ? h.getDestination().getName() : "Popular Area";
                sb.append(String.format("- ID %d: '%s' in %s | Rating: %.1f Stars | Starting Price: ₹%s/night\n",
                        h.getId(),
                        h.getName(),
                        dest,
                        (h.getStarRating() != null ? h.getStarRating().doubleValue() : 4.0),
                        (h.getStartingPricePerNight() != null ? h.getStartingPricePerNight() : "N/A")));

                if (hasHotelIntent && actions.size() < 4) {
                    actions.add(ChatAction.builder()
                            .type("HOTEL")
                            .label("View Hotel: " + h.getName())
                            .url("/hotels/" + h.getId())
                            .entityId(h.getId())
                            .build());
                }
            }
        }

        // Fetch Destinations
        List<Destination> destinations = destinationRepository.findByIsPublishedTrue(PageRequest.of(0, 5)).getContent();
        if (!destinations.isEmpty()) {
            sb.append("\nFEATURED DESTINATIONS:\n");
            for (Destination d : destinations) {
                sb.append(String.format("- ID %d: %s (%s) | Best Season: %s\n",
                        d.getId(),
                        d.getName(),
                        d.getCountry(),
                        d.getBestTimeToVisit() != null ? d.getBestTimeToVisit() : "All year round"));
            }
        }

        sb.append("===================================================\n");

        // Build dynamic contextual prompts
        if (hasBookingIntent) {
            suggestedPrompts.add("How do I complete payment for my booking?");
            suggestedPrompts.add("Can I cancel my reservation?");
            suggestedPrompts.add("What packages are available for a new trip?");
        } else if (hasPackageIntent) {
            suggestedPrompts.add("Which package is best for a 5-day holiday?");
            suggestedPrompts.add("What are luxury tier options?");
            suggestedPrompts.add("Tell me about hotels in Goa");
        } else {
            suggestedPrompts.add("What destinations are available?");
            suggestedPrompts.add("Show me holiday packages under ₹30,000");
            suggestedPrompts.add("What hotels do you recommend?");
            suggestedPrompts.add("How does booking and payment work?");
        }

        return ContextBundle.builder()
                .systemPrompt(sb.toString())
                .actions(actions)
                .suggestedPrompts(suggestedPrompts)
                .build();
    }
}
