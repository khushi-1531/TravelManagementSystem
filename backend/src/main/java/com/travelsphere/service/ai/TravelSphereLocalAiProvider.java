package com.travelsphere.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Intelligent local fallback AI provider grounded directly in TravelSphere catalogue data.
 * Used when third-party AI keys are not configured, enabling full offline functionality,
 * automated testing, and development without external network dependencies.
 */
@Slf4j
@Component("travelSphereLocalAiProvider")
public class TravelSphereLocalAiProvider implements AiProvider {

    @Override
    public String generateCompletion(List<AiMessage> messages, AiCompletionOptions options) {
        log.debug("Generating completion using TravelSphere Local Grounded AI Provider.");

        // Extract system context and last user message
        String systemContext = "";
        String userQuery = "";

        for (AiMessage msg : messages) {
            if ("system".equalsIgnoreCase(msg.getRole())) {
                systemContext = msg.getContent();
            } else if ("user".equalsIgnoreCase(msg.getRole())) {
                userQuery = msg.getContent();
            }
        }

        String lowerQuery = userQuery.toLowerCase();

        // 1. Booking queries
        if (lowerQuery.contains("booking") || lowerQuery.contains("reservation") || lowerQuery.contains("my trip") || lowerQuery.contains("status")) {
            if (systemContext.contains("AUTHENTICATED CUSTOMER ACTIVE BOOKINGS:")) {
                String bookingsSection = extractSection(systemContext, "AUTHENTICATED CUSTOMER ACTIVE BOOKINGS:", "====");
                return "Here is the current status of your reservations on TravelSphere:\n\n" +
                        bookingsSection.trim() + "\n\n" +
                        "You can manage, view invoices, or complete payments anytime under **My Bookings** in your profile menu.";
            } else if (systemContext.contains("No authenticated customer active bookings found.")) {
                return "I checked your account and you currently do not have any active or pending reservations. " +
                        "Would you like recommendations for our trending holiday packages or hotel stays?";
            } else {
                return "To inspect your active reservations and booking statuses, please sign in to your TravelSphere account. " +
                        "Once logged in, I can retrieve your specific itinerary details.";
            }
        }

        // 2. Package queries
        if (lowerQuery.contains("package") || lowerQuery.contains("tour") || lowerQuery.contains("trip") || lowerQuery.contains("budget")) {
            if (systemContext.contains("AVAILABLE TRAVEL PACKAGES:")) {
                String pkgSection = extractSection(systemContext, "AVAILABLE TRAVEL PACKAGES:", "====");
                return "TravelSphere offers curated, expert-crafted tour packages matching your interest:\n\n" +
                        pkgSection.trim() + "\n\n" +
                        "Each package includes daily milestone itineraries, accommodation, and verified tour guides. Select any package to reserve your dates.";
            }
        }

        // 3. Hotel queries
        if (lowerQuery.contains("hotel") || lowerQuery.contains("room") || lowerQuery.contains("stay") || lowerQuery.contains("accommodation")) {
            if (systemContext.contains("FEATURED HOTELS & ACCOMMODATIONS:")) {
                String hotelSection = extractSection(systemContext, "FEATURED HOTELS & ACCOMMODATIONS:", "====");
                return "Here are top-rated accommodations available in TravelSphere's catalogue:\n\n" +
                        hotelSection.trim() + "\n\n" +
                        "You can view complete room categories, nightly rates, and complimentary breakfast options on each hotel's detail page.";
            }
        }

        // 4. Destination & places queries
        if (lowerQuery.contains("destination") || lowerQuery.contains("place") || lowerQuery.contains("where") || lowerQuery.contains("visit") || lowerQuery.contains("city")) {
            if (systemContext.contains("FEATURED DESTINATIONS:")) {
                String destSection = extractSection(systemContext, "FEATURED DESTINATIONS:", "====");
                return "Welcome to TravelSphere! Here are prime travel destinations available in our discovery catalogue:\n\n" +
                        destSection.trim() + "\n\n" +
                        "Which destination would you like to explore in detail?";
            }
        }

        // 5. Payment queries
        if (lowerQuery.contains("payment") || lowerQuery.contains("pay") || lowerQuery.contains("razorpay") || lowerQuery.contains("card") || lowerQuery.contains("upi")) {
            return "TravelSphere supports secure online payment via Credit/Debit Cards, UPI (Google Pay, PhonePe), Net Banking, and Wallets through our Razorpay-secured checkout.\n\n" +
                    "To complete payment for an active reservation, head to **My Bookings**, select your pending trip, and click **Pay Now**.";
        }

        // 6. General / Default response grounded in context
        return "Hello! I am your **TravelSphere AI Travel Assistant**. I can help you discover destinations, compare holiday packages, locate luxury and boutique hotels, and check your reservation details.\n\n" +
                "Try asking:\n" +
                "• *What holiday packages are available?*\n" +
                "• *Show me top destinations in India*\n" +
                "• *Find hotels with complimentary breakfast*\n" +
                "• *What is the status of my booking?*";
    }

    private String extractSection(String fullText, String startMarker, String endMarker) {
        int startIndex = fullText.indexOf(startMarker);
        if (startIndex == -1) return "";
        startIndex += startMarker.length();
        int endIndex = fullText.indexOf(endMarker, startIndex);
        if (endIndex == -1) {
            return fullText.substring(startIndex).trim();
        }
        return fullText.substring(startIndex, endIndex).trim();
    }

    @Override
    public boolean isConfigured() {
        return true; // Always available as local fallback
    }

    @Override
    public String getProviderName() {
        return "TravelSphere Local Grounded Assistant";
    }
}
