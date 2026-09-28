package com.travelsphere;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelsphere.entity.Destination;
import com.travelsphere.entity.Hotel;
import com.travelsphere.entity.TravelPackage;
import com.travelsphere.repository.DestinationRepository;
import com.travelsphere.repository.HotelRepository;
import com.travelsphere.repository.TravelPackageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class CatalogueAndDiscoveryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private TravelPackageRepository travelPackageRepository;

    @Test
    @Order(1)
    @DisplayName("1. List destinations returns 200 with paginated items")
    void testListDestinations() throws Exception {
        mockMvc.perform(get("/api/v1/destinations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(12))))
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(12)))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(12)));
    }

    @Test
    @Order(2)
    @DisplayName("2. Get destination by ID returns 200")
    void testGetDestinationById() throws Exception {
        Destination jaipur = destinationRepository.findBySlug("jaipur")
                .orElseThrow(() -> new AssertionError("Seed data missing Jaipur"));

        mockMvc.perform(get("/api/v1/destinations/" + jaipur.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(jaipur.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is("Jaipur")))
                .andExpect(jsonPath("$.data.slug", is("jaipur")));
    }

    @Test
    @Order(3)
    @DisplayName("3. Get destination by slug returns 200")
    void testGetDestinationBySlug() throws Exception {
        mockMvc.perform(get("/api/v1/destinations/slug/goa")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("goa")))
                .andExpect(jsonPath("$.data.name", is("Goa")));
    }

    @Test
    @Order(4)
    @DisplayName("4. Get destination with nonexistent ID returns 404")
    void testDestinationNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/destinations/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @Order(5)
    @DisplayName("5. Search destinations by query returns matching items")
    void testSearchDestinationsByQuery() throws Exception {
        mockMvc.perform(get("/api/v1/destinations")
                        .param("query", "Pink City")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].name", is("Jaipur")));
    }

    @Test
    @Order(6)
    @DisplayName("6. List places for destination returns child places")
    void testListPlacesForDestination() throws Exception {
        Destination jaipur = destinationRepository.findBySlug("jaipur")
                .orElseThrow(() -> new AssertionError("Seed data missing Jaipur"));

        mockMvc.perform(get("/api/v1/destinations/" + jaipur.getId() + "/places")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[0].destinationId", is(jaipur.getId().intValue())));
    }

    @Test
    @Order(7)
    @DisplayName("7. List hotels returns paginated active hotels")
    void testListHotels() throws Exception {
        mockMvc.perform(get("/api/v1/hotels")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(10))))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(17)));
    }

    @Test
    @Order(8)
    @DisplayName("8. Filter hotels by destination returns matching destination only")
    void testFilterHotelsByDestination() throws Exception {
        Destination jaipur = destinationRepository.findBySlug("jaipur")
                .orElseThrow(() -> new AssertionError("Seed data missing Jaipur"));

        MvcResult result = mockMvc.perform(get("/api/v1/hotels")
                        .param("destinationId", String.valueOf(jaipur.getId()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.path("data").path("content");
        assertTrue(content.size() >= 1);
        for (JsonNode hotelNode : content) {
            assertEquals(jaipur.getId().intValue(), hotelNode.path("destinationId").asInt());
        }
    }

    @Test
    @Order(9)
    @DisplayName("9. Filter hotels by price range")
    void testFilterHotelsByPriceRange() throws Exception {
        BigDecimal min = new BigDecimal("4000.00");
        BigDecimal max = new BigDecimal("12000.00");

        MvcResult result = mockMvc.perform(get("/api/v1/hotels")
                        .param("minPrice", "4000.00")
                        .param("maxPrice", "12000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.path("data").path("content");
        assertTrue(content.size() > 0);
        for (JsonNode hotelNode : content) {
            BigDecimal price = new BigDecimal(hotelNode.path("startingPricePerNight").asText());
            assertTrue(price.compareTo(min) >= 0);
            assertTrue(price.compareTo(max) <= 0);
        }
    }

    @Test
    @Order(10)
    @DisplayName("10. Get hotel by ID returns hotel and its active rooms")
    void testGetHotelByIdWithRooms() throws Exception {
        Hotel hotel = hotelRepository.findAll().stream()
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Seed data missing active hotel"));

        mockMvc.perform(get("/api/v1/hotels/" + hotel.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(hotel.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is(hotel.getName())))
                .andExpect(jsonPath("$.data.rooms", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(11)
    @DisplayName("11. List hotel rooms by hotel ID returns room list")
    void testListHotelRooms() throws Exception {
        Hotel hotel = hotelRepository.findAll().stream()
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Seed data missing active hotel"));

        mockMvc.perform(get("/api/v1/hotels/" + hotel.getId() + "/rooms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].hotelId", is(hotel.getId().intValue())));
    }

    @Test
    @Order(12)
    @DisplayName("12. List packages returns paginated active travel packages")
    void testListPackages() throws Exception {
        mockMvc.perform(get("/api/v1/packages")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(10)));
    }

    @Test
    @Order(13)
    @DisplayName("13. Filter packages by destination")
    void testFilterPackagesByDestination() throws Exception {
        Destination jaipur = destinationRepository.findBySlug("jaipur")
                .orElseThrow(() -> new AssertionError("Seed data missing Jaipur"));

        MvcResult result = mockMvc.perform(get("/api/v1/packages")
                        .param("destinationId", String.valueOf(jaipur.getId()))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.path("data").path("content");
        assertTrue(content.size() >= 1);
        for (JsonNode node : content) {
            assertEquals(jaipur.getId().intValue(), node.path("destinationId").asInt());
        }
    }

    @Test
    @Order(14)
    @DisplayName("14. Filter packages by price range")
    void testFilterPackagesByPriceRange() throws Exception {
        BigDecimal min = new BigDecimal("10000.00");
        BigDecimal max = new BigDecimal("30000.00");

        MvcResult result = mockMvc.perform(get("/api/v1/packages")
                        .param("minPrice", "10000.00")
                        .param("maxPrice", "30000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode content = root.path("data").path("content");
        assertTrue(content.size() > 0);
        for (JsonNode pkgNode : content) {
            BigDecimal price = new BigDecimal(pkgNode.path("basePricePerPerson").asText());
            assertTrue(price.compareTo(min) >= 0);
            assertTrue(price.compareTo(max) <= 0);
        }
    }

    @Test
    @Order(15)
    @DisplayName("15. Get package by ID returns package with itinerary items")
    void testGetPackageByIdWithItems() throws Exception {
        TravelPackage pkg = travelPackageRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Seed data missing active package"));

        mockMvc.perform(get("/api/v1/packages/" + pkg.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(pkg.getId().intValue())))
                .andExpect(jsonPath("$.data.title", is(pkg.getTitle())))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(16)
    @DisplayName("16. List package items returns day-by-day activities")
    void testListPackageItems() throws Exception {
        TravelPackage pkg = travelPackageRepository.findAll().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Seed data missing active package"));

        mockMvc.perform(get("/api/v1/packages/" + pkg.getId() + "/items")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].packageId", is(pkg.getId().intValue())))
                .andExpect(jsonPath("$.data[0].dayNumber", is(1)));
    }

    @Test
    @Order(17)
    @DisplayName("17. Pagination structure correctness")
    void testPaginationStructureCorrectness() throws Exception {
        mockMvc.perform(get("/api/v1/destinations")
                        .param("page", "0")
                        .param("size", "4")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(4)))
                .andExpect(jsonPath("$.data.content", hasSize(4)))
                .andExpect(jsonPath("$.data.totalPages", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(12)))
                .andExpect(jsonPath("$.data.last", is(false)));
    }

    @Test
    @Order(18)
    @DisplayName("18. Sorting functionality operates cleanly")
    void testSortingFunctionality() throws Exception {
        // Test price_asc on hotels
        MvcResult ascResult = mockMvc.perform(get("/api/v1/hotels")
                        .param("sort", "price_asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode ascContent = objectMapper.readTree(ascResult.getResponse().getContentAsString())
                .path("data").path("content");
        assertTrue(ascContent.size() >= 2);
        BigDecimal firstPrice = new BigDecimal(ascContent.get(0).path("startingPricePerNight").asText());
        BigDecimal secondPrice = new BigDecimal(ascContent.get(1).path("startingPricePerNight").asText());
        assertTrue(firstPrice.compareTo(secondPrice) <= 0);

        // Test price_desc on hotels
        MvcResult descResult = mockMvc.perform(get("/api/v1/hotels")
                        .param("sort", "price_desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode descContent = objectMapper.readTree(descResult.getResponse().getContentAsString())
                .path("data").path("content");
        assertTrue(descContent.size() >= 2);
        BigDecimal descFirstPrice = new BigDecimal(descContent.get(0).path("startingPricePerNight").asText());
        BigDecimal descSecondPrice = new BigDecimal(descContent.get(1).path("startingPricePerNight").asText());
        assertTrue(descFirstPrice.compareTo(descSecondPrice) >= 0);
    }

    @Test
    @Order(19)
    @DisplayName("19. Invalid pagination parameters return 400 Bad Request")
    void testInvalidPaginationInput() throws Exception {
        mockMvc.perform(get("/api/v1/destinations")
                        .param("page", "-1")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        mockMvc.perform(get("/api/v1/destinations")
                        .param("page", "0")
                        .param("size", "0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @Order(20)
    @DisplayName("20. Invalid price range (min > max) returns 400 Bad Request")
    void testInvalidPriceRange() throws Exception {
        mockMvc.perform(get("/api/v1/hotels")
                        .param("minPrice", "25000.00")
                        .param("maxPrice", "5000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("minPrice cannot be greater than maxPrice")));

        mockMvc.perform(get("/api/v1/packages")
                        .param("minPrice", "40000.00")
                        .param("maxPrice", "10000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("minPrice cannot be greater than maxPrice")));
    }

    @Test
    @Order(21)
    @DisplayName("21. Unpublished destination is not visible in public catalogue")
    void testUnpublishedDestinationNotVisible() throws Exception {
        Destination unpublished = new Destination();
        unpublished.setName("Secret Haven " + UUID.randomUUID().toString().substring(0, 5));
        unpublished.setState("Secret State");
        unpublished.setCountry("India");
        unpublished.setDescription("Hidden place");
        unpublished.setHeroImageUrl("https://images.unsplash.com/photo-hidden");
        unpublished.setIsPublished(false);
        unpublished.setIsFeatured(false);
        unpublished = destinationRepository.save(unpublished);

        // Should not appear in list
        MvcResult listResult = mockMvc.perform(get("/api/v1/destinations")
                        .param("query", unpublished.getName())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode content = objectMapper.readTree(listResult.getResponse().getContentAsString())
                .path("data").path("content");
        assertEquals(0, content.size());

        // Should return 404 when requested by id
        mockMvc.perform(get("/api/v1/destinations/" + unpublished.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        // Should return 404 when requested by slug
        mockMvc.perform(get("/api/v1/destinations/slug/" + unpublished.getSlug())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        destinationRepository.delete(unpublished);
    }

    @Test
    @Order(22)
    @DisplayName("22. Inactive hotel and package are not visible in public discovery")
    void testInactiveHotelAndPackageNotVisible() throws Exception {
        Destination jaipur = destinationRepository.findBySlug("jaipur")
                .orElseThrow(() -> new AssertionError("Seed data missing Jaipur"));

        // Create inactive hotel
        Hotel inactiveHotel = new Hotel();
        inactiveHotel.setName("Inactive Hotel " + UUID.randomUUID().toString().substring(0, 5));
        inactiveHotel.setDestination(jaipur);
        inactiveHotel.setAddress("Inactive Rd");
        inactiveHotel.setHeroImageUrl("https://images.unsplash.com/photo-inactive");
        inactiveHotel.setStartingPricePerNight(new BigDecimal("9999.00"));
        inactiveHotel.setIsActive(false);
        inactiveHotel = hotelRepository.save(inactiveHotel);

        // Should not appear in list
        MvcResult hotelResult = mockMvc.perform(get("/api/v1/hotels")
                        .param("query", inactiveHotel.getName())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode hotelContent = objectMapper.readTree(hotelResult.getResponse().getContentAsString())
                .path("data").path("content");
        assertEquals(0, hotelContent.size());

        // Should return 404 on get by id
        mockMvc.perform(get("/api/v1/hotels/" + inactiveHotel.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        hotelRepository.delete(inactiveHotel);

        // Create inactive package
        TravelPackage inactivePkg = new TravelPackage();
        inactivePkg.setTitle("Inactive Package " + UUID.randomUUID().toString().substring(0, 5));
        inactivePkg.setDestination(jaipur);
        inactivePkg.setDurationDays(3);
        inactivePkg.setDurationNights(2);
        inactivePkg.setBasePricePerPerson(new BigDecimal("12000.00"));
        inactivePkg.setHeroImageUrl("https://images.unsplash.com/photo-pkg-inactive");
        inactivePkg.setInclusions("None");
        inactivePkg.setExclusions("All");
        inactivePkg.setIsActive(false);
        inactivePkg = travelPackageRepository.save(inactivePkg);

        // Should not appear in list
        MvcResult pkgResult = mockMvc.perform(get("/api/v1/packages")
                        .param("query", inactivePkg.getTitle())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode pkgContent = objectMapper.readTree(pkgResult.getResponse().getContentAsString())
                .path("data").path("content");
        assertEquals(0, pkgContent.size());

        // Should return 404 on get by id
        mockMvc.perform(get("/api/v1/packages/" + inactivePkg.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        travelPackageRepository.delete(inactivePkg);
    }
}
