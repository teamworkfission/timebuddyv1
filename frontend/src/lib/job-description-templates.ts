/**
 * Job Description Templates by Business Type
 * Auto-populated when employer selects a business
 */

export interface JobDescriptionTemplate {
  title: string;
  description: string;
}

export const JOB_DESCRIPTION_TEMPLATES: Record<string, JobDescriptionTemplate> = {
  restaurant: {
    title: 'Restaurant Staff (Server / Support)',
    description: `Join our team in providing excellent dining experiences. Responsibilities include greeting guests, taking orders, serving food and drinks, clearing tables, and maintaining cleanliness. Support kitchen and front-of-house operations as needed.

Duties:
• Welcome and assist customers with menu selections
• Deliver food/beverages promptly and accurately
• Keep dining area and service stations clean
• Handle payments and issue receipts
• Follow food safety and hygiene standards`,
  },

  gas_station: {
    title: 'Gas Station Attendant / Cashier',
    description: `Assist customers at a busy fueling station. Handle transactions, provide directions, and maintain a safe, clean environment.

Duties:
• Operate cash register and process fuel purchases
• Assist customers with fuel pumps when required
• Stock shelves and maintain product displays
• Monitor safety around fueling areas
• Perform light cleaning (restrooms, counters, pumps)`,
  },

  retail_store: {
    title: 'Retail Associate',
    description: `Support daily store operations and help customers with product selections. Maintain inventory and keep the store organized.

Duties:
• Greet and assist shoppers
• Stock shelves and replenish products
• Operate POS system for sales
• Keep aisles tidy and assist in merchandising
• Handle customer inquiries or returns`,
  },

  grocery_store: {
    title: 'Grocery Clerk / Stocker',
    description: `Help customers and ensure shelves are stocked with fresh products. Maintain cleanliness and assist with checkout if needed.

Duties:
• Stock shelves and rotate inventory
• Assist customers in finding items
• Bag groceries and help at checkout
• Keep aisles and storage clean
• Follow safety and food handling rules`,
  },

  convenience_store: {
    title: 'Store Clerk',
    description: `Work in a fast-paced environment, handling cashier duties, stocking products, and providing friendly service.

Duties:
• Greet customers and process purchases
• Refill shelves and coolers
• Monitor store security and cleanliness
• Assist with lottery, tobacco, or age-restricted items
• Provide quick, polite service`,
  },

  pharmacy: {
    title: 'Pharmacy Clerk / Assistant',
    description: `Assist customers with prescriptions and store products. Support pharmacists and maintain store order.

Duties:
• Greet customers and manage checkout
• Organize over-the-counter items
• Support prescription pick-up and drop-off
• Maintain confidentiality and compliance
• Keep pharmacy area neat and clean`,
  },

  coffee_shop: {
    title: 'Barista',
    description: `Prepare and serve coffee, tea, and snacks in a friendly café environment.

Duties:
• Greet and take customer orders
• Prepare espresso drinks and beverages
• Handle cash and card payments
• Restock ingredients and supplies
• Keep work area and seating clean`,
  },

  fast_food: {
    title: 'Crew Member',
    description: `Join a quick-service team preparing food, taking orders, and serving customers in a fast-paced environment.

Duties:
• Take orders at counter or drive-thru
• Assemble food and drink items
• Maintain kitchen and prep areas
• Keep dining and work areas clean
• Provide quick and accurate service`,
  },

  delivery_service: {
    title: 'Delivery Driver / Courier',
    description: `Deliver packages, food, or goods safely and on time to customers.

Duties:
• Pick up and deliver orders promptly
• Verify delivery addresses and payments
• Handle packages with care
• Follow traffic and safety rules
• Provide polite customer service`,
  },

  warehouse: {
    title: 'Warehouse Associate',
    description: `Support warehouse operations through packing, loading, and organizing inventory.

Duties:
• Receive and sort incoming stock
• Pick, pack, and ship orders
• Operate pallet jacks or forklifts (if trained)
• Maintain warehouse cleanliness
• Assist in inventory counts`,
  },

  office: {
    title: 'Office Assistant',
    description: `Provide administrative support including clerical tasks, communication, and file management.

Duties:
• Answer phones and greet visitors
• Organize files and documents
• Assist with scheduling and emails
• Maintain office supplies
• Support staff with day-to-day tasks`,
  },

  other: {
    title: 'General Worker',
    description: `Perform flexible duties depending on business needs. Tasks may vary across industries.

Duties:
• Support general business operations
• Perform customer service or support tasks
• Help with setup, cleaning, or stocking
• Follow instructions from supervisors
• Maintain workplace safety and professionalism`,
  },
};

/**
 * Get job description template by business type
 * @param businessType - The type of business (e.g., 'restaurant', 'retail_store')
 * @returns JobDescriptionTemplate or undefined if not found
 */
export function getJobDescriptionTemplate(businessType: string): JobDescriptionTemplate | undefined {
  return JOB_DESCRIPTION_TEMPLATES[businessType];
}

