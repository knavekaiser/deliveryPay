const productModel = new Schema(
  {
    type: { type: String, required: true },
    category: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    dscr: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    material: { type: String },
    size: { type: String },
    discount: {
      type: { type: String, enum: ["flat", "percent", null] },
      amount: { type: Number },
      dscr: { type: String },
    },
    available: {},
    gst: { type: Number },
    hsn: { type: String },
    tags: [{ type: String }],
    popularity: { type: Number },
    fbMarketId: { type: String },
    reviews: [
      new Schema(
        {
          user: { type: Schema.Types.ObjectId, ref: "User", req: true },
          rating: { type: Number, required: true },
          review: { type: String },
        },
        { timestamps: true }
      ),
    ],
    status: { type: String },
  },
  { timestamps: true }
);
global.Product = mongoose.model("Product", productModel);

const orderModel = new Schema(
  {
    buyer: {
      _id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      profileImg: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    seller: {
      _id: { type: Schema.Types.ObjectId, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      profileImg: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    products: [{}],
    status: { type: String, default: "pending" },
    total: { type: Number, required: true },
    milestones: [
      {
        type: Schema.Types.ObjectId,
        ref: "Milestone",
      },
    ],
    fee: { type: Number, required: true },
    deliveryDetail: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: Number },
      landmark: { type: String },
      locality: { type: String },
      alternatePhone: { type: String },
      deliveryWithin: { type: Number },
    },
    files: [{ type: String }],
    terms: [{ type: String }],
    coupon: {},
    refundable: { type: String },
    shippingCost: { type: Number },
    deliveredAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true }
);
global.Order = mongoose.model("Order", orderModel);

const categoryModel = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  categories: [{ type: String }],
});
global.Category = mongoose.model("Category", categoryModel);

const refundModel = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyer: {
      _id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      profileImg: { type: String },
    },
    seller: {
      _id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      profileImg: { type: String },
    },
    issue: { type: String, required: true },
    dscr: { type: String, required: true },
    files: [{ type: String }],
    milestones: [
      {
        type: Schema.Types.ObjectId,
        ref: "Milestone",
      },
    ],
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);
global.Refund = mongoose.model("Refund", refundModel);

const couponModel = new Schema(
  {
    title: { type: String },
    dscr: { type: String },
    image: { type: String },
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ["percent", "flat"] },
    amount: { type: Number, required: true },
    maxDiscount: { type: Number, required: true },
    threshold: { type: Number, required: true },
    date: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },
    status: { type: String, default: "draft" },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sellers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    terms: [{ type: String }],
    termsUrl: { type: String },
    validPerUser: { type: Number, default: 1 },
  },
  { timestamps: true }
);
global.Coupon = mongoose.model("Coupon", couponModel);
