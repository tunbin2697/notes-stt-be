// src/cart/cart.service.ts
import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';
// Assume BusinessRuleException is defined elsewhere

// Mock repository for demonstration
class CartRepository {
  private carts: Record<string, string[]> = {}; // userId -> itemIds
  async countItems(userId: string): Promise<number> {
    return (this.carts[userId] || []).length;
  }
  async add(userId: string, itemId: string): Promise<string> {
    if (!this.carts[userId]) this.carts[userId] = [];
    this.carts[userId].push(itemId);
    return itemId;
  }
}

@Injectable()
export class CartService {
  private readonly MAX_ITEMS = 10; // Centralized rule constant

  constructor(private readonly cartRepository: CartRepository) {}

  /**
   * Public method for the business action (called by the Resolver).
   */
  async addItem(userId: string, itemId: string) {
    // 1. Policy Block Call (Guard clause)
    // 💡 This line acts as the gatekeeper.
    await this.enforceAddItemRules(userId);

    // 2. Execution (Action)
    const item = await this.cartRepository.add(userId, itemId);

    return item;
  }

  // ------------------------------------------------------------------
  // 🚀 POLICY BLOCK: Private methods encapsulate all business rules
  // ------------------------------------------------------------------

  /**
   * Private method that aggregates all validation logic for adding an item.
   * This is your centralized "policy block" for the MVP.
   */
  private async enforceAddItemRules(userId: string): Promise<void> {
    await this.checkItemCountLimit(userId);
    // await this.checkItemAvailability(itemId); // Add other rules here later
  }

  /**
   * Specific Rule A: Checks if the user has reached the cart item limit.
   */
  private async checkItemCountLimit(userId: string): Promise<void> {
    const currentCount = await this.cartRepository.countItems(userId);

    if (currentCount >= this.MAX_ITEMS) {
      throw new BusinessRuleException(
        `Your cart cannot contain more than ${this.MAX_ITEMS} items.`,
      );
    }
  }
}
