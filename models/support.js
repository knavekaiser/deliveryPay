const ticketModel = new Schema(
  {
    issue: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String },
    status: { type: String, default: "open", enum: ["open", "closed"] },
    milestone: { type: Schema.Types.ObjectId, ref: "Milestone" },
    transaction: { type: Schema.Types.ObjectId, ref: "Transaction" },
    messages: [
      new Schema(
        {
          user: {
            name: { type: String, required: true },
            role: { type: String, required: true },
          },
          message: {
            body: { type: String, required: true },
            files: [{ type: String }],
          },
        },
        { timestamps: true }
      ),
    ],
  },
  { timestamps: true }
);
global.Ticket = mongoose.model("Ticket", ticketModel);

const contactUsModel = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
);
global.ContactUs = mongoose.model("ContactUs", contactUsModel);

const workRequestModel = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String },
    phone: { type: String },
    dscr: { type: String },
    resume: { type: String, required: true },
  },
  { timestamps: true }
);
global.WorkRequest = mongoose.model("WorkRequest", workRequestModel);

const feedbackModel = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);
global.Feedback = mongoose.model("Feedback", feedbackModel);

const faqModel = new Schema(
  {
    ques: { type: String, required: true },
    ans: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
global.Faq = mongoose.model("Faq", faqModel);

const reportModel = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "user", required: true },
    against: { type: Schema.Types.ObjectId, ref: "user", required: true },
    message: { type: String, required: true },
    status: { type: "String", default: "active" },
  },
  { timestamps: true }
);
global.Report = mongoose.model("Report", reportModel);

const configModel = new Schema(
  {
    fee: { type: Number },
    gst: { type: Number },
  },
  { timestamps: true }
);
global.Config = mongoose.model("Config", configModel);

const bugModel = new Schema(
  {
    user: {
      name: { type: String },
      phone: { type: String },
    },
    issue: { type: String },
    dscr: {},
    url: { type: String },
    files: [{ type: String }],
  },
  { timestamps: true }
);
global.Bug = mongoose.model("Bug", bugModel);
