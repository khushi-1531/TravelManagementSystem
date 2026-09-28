package com.travelsphere.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatAction {

    /**
     * Action type category (e.g. PACKAGE, DESTINATION, HOTEL, BOOKING, PAYMENT).
     */
    private String type;

    /**
     * Human-friendly button or pill label.
     */
    private String label;

    /**
     * Target internal React route path (e.g. /packages/2, /hotels/5, /bookings).
     */
    private String url;

    /**
     * Target entity primary key if applicable.
     */
    private Long entityId;
}
