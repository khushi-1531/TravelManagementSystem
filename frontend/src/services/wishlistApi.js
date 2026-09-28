import api from './api';

export const wishlistApi = {
  /**
   * Retrieve all wishlisted items for the current user (optionally filtered by ?type=DESTINATION).
   */
  getWishlist: async (type = null) => {
    const params = type ? { type } : {};
    const response = await api.get('/wishlist', { params });
    return response.data.data; // List<WishlistItemResponse>
  },

  /**
   * Add a destination, hotel, or package to wishlist.
   */
  addToWishlist: async (targetType, targetId) => {
    const response = await api.post('/wishlist', { targetType, targetId });
    return response.data.data; // WishlistItemResponse
  },

  /**
   * Remove item from wishlist by wishlist record ID.
   */
  removeFromWishlist: async (id) => {
    const response = await api.delete(`/wishlist/${id}`);
    return response.data.data;
  },

  /**
   * Remove item from wishlist by targetType and targetId.
   */
  removeByTarget: async (targetType, targetId) => {
    const response = await api.delete(`/wishlist/target/${targetType}/${targetId}`);
    return response.data.data;
  },

  /**
   * Check if an item is already wishlisted by the current user.
   */
  checkWishlistStatus: async (targetType, targetId) => {
    const response = await api.get('/wishlist/check', {
      params: { targetType, targetId }
    });
    return response.data.data; // { isWishlisted: boolean, wishlistId: Long }
  },

  /**
   * Get set of wishlisted target keys ("DESTINATION:1", "HOTEL:2") for batch cards.
   */
  getWishlistTargetKeys: async () => {
    const response = await api.get('/wishlist/ids');
    return response.data.data; // Array/Set of keys
  }
};

export default wishlistApi;
