const {
  handleSignIn,
  signingIn,
  signToken,
  genCode,
} = require("../config/passport.js");

app.post("/api/registerUser", (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  if (firstName && lastName && phone && email && password) {
    bcrypt
      .hash(password, 10)
      .then((hash) => {
        return new User({
          ...req.body,
          pass: hash,
          userId: `${firstName}_${lastName}_${new Date().getTime()}`,
        }).save();
      })
      .then((dbRes) => {
        if (dbRes) {
          signingIn(dbRes, res);
        } else {
          res.status(500).json({ message: "something went wrong" });
        }
      })
      .catch((err) => {
        if (err.code === 11000) {
          res.status(400).json({
            message: "user exists",
            code: err.code,
            field: Object.keys(err.keyValue)[0],
          });
        } else {
          console.log(err);
          res.status(500).json({ message: "something went wrong" });
        }
      });
  } else {
    res.status(400).json({ message: "Incomplete request" });
  }
});
app.post(
  "/api/userLogin",
  passport.authenticate("user", { session: false, failWithError: true }),
  handleSignIn,
  (err, req, res, next) => {
    console.log(err);
    res.status(401).json({ code: 401, message: "invalid credentials" });
  }
);
app.get(
  "/api/authUser",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const user = { ...req.user._doc };
    ["pass", "__v"].forEach((key) => delete user[key]);
    res.json({ code: "ok", user });
  },
  (err, req, res, next) => {
    res.status(401).json({ code: 401, message: "invalid credentials" });
  }
);

app.get(
  "/api/viewUserProfile",
  passport.authenticate("userPrivate"),
  (req, res) => {
    User.aggregate([
      { $match: { _id: ObjectId(req.user._id) } },
      {
        $lookup: {
          from: "paymentmethods",
          localField: "paymentMethods",
          foreignField: "_id",
          as: "paymentMethods",
        },
      },
      {
        $project: {
          pass: 0,
        },
      },
    ])
      .then((dbRes) => {
        if (dbRes.length) {
          res.json(dbRes[0]);
        } else {
          res.status(400).json({ message: "bad request" });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({ message: "something went wrong" });
      });
  }
);
app.patch(
  "/api/editUserProfile",
  passport.authenticate("userPrivate"),
  async (req, res) => {
    console.log(req.body);
    User.findOneAndUpdate(
      { _id: req.user._id },
      {
        ...req.body,
        ...(req.body.password && {
          pass: await bcrypt.hash(req.body.password, 10),
        }),
      },
      { new: true }
    )
      .then((user) => {
        res.json({ message: "profile updated", user });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "something went wrong" });
      });
  }
);

app.post("/api/sendUserOTP", async (req, res) => {
  const { phone } = req.body;
  const code = genCode(6);
  const [user, hash] = await Promise.all([
    User.findOne({ phone }),
    bcrypt.hash(code, 10),
    OTP.findOneAndDelete({ id: phone }),
  ]);
  if (user) {
    new OTP({
      id: req.body.phone,
      code: hash,
    })
      .save()
      .then((dbRes) => {
        if (dbRes) {
          // send text massage here
          res.json({
            message: "6 digit code has been sent, enter it within 2 minutes",
          });
        } else {
          res.status(500).json({ message: "something went wrong" });
        }
      })
      .catch((err) => {
        console.log(err);
        console.log("something went wrong");
      });
  } else {
    res.status(400).json({ message: "invalid request" });
  }
});
app.put("/api/submitUserOTP", async (req, res) => {
  const { phone, code } = req.body;
  const dbOtp = await OTP.findOne({ id: phone });
  if (!dbOtp) {
    res.status(404).json({ message: "code does not exists" });
    return;
  }
  if (bcrypt.compareSync(code, dbOtp.code)) {
    User.findOne({ phone }).then((dbUser) => {
      const user = JSON.parse(JSON.stringify(dbUser));
      signingIn(user, res);
    });
  } else {
    if (dbOtp.attempt > 2) {
      OTP.findOneAndDelete({ id: phone }).then(() => {
        res.status(429).json({ message: "start again" });
      });
    } else {
      dbOtp.updateOne({ attempt: dbOtp.attempt + 1 }).then(() => {
        res
          .status(400)
          .json({ message: "wrong code", attempt: dbOtp.attempt + 1 });
      });
    }
  }
});

app.post("/api/sendUserForgotPassOTP", async (req, res) => {
  const { phone, email } = req.body;
  const code = genCode(6);
  console.log(code);
  const [user, hash] = await Promise.all([
    User.findOne({ $or: [{ phone }, { email }] }),
    bcrypt.hash(code, 10),
    OTP.findOneAndDelete({ id: phone || email }),
  ]);
  if (user) {
    new OTP({
      id: phone || email,
      code: hash,
    })
      .save()
      .then((dbRes) => {
        if (dbRes) {
          // send text massage or email here
          res.json({
            message: "6 digit code has been sent, enter it within 2 minutes",
          });
        } else {
          res.status(500).json({ message: "something went wrong" });
        }
      })
      .catch((err) => {
        console.log(err);
        console.log("something went wrong");
      });
  } else {
    res.status(400).json({ message: "invalid request" });
  }
});
app.put("/api/submitUserForgotPassOTP", async (req, res) => {
  const { phone, email, code } = req.body;
  const dbOtp = await OTP.findOne({ id: phone || email });
  if (!dbOtp) {
    res.status(404).json({ message: "code does not exists" });
    return;
  }
  if (bcrypt.compareSync(code, dbOtp.code)) {
    OTP.findOneAndUpdate(
      { _id: dbOtp._id },
      { expireAt: new Date(new Date().getTime() + 120000) }
    )
      .then(() => {
        res.json({ code: "ok", message: "OTP correct" });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "something went wrong" });
      });
  } else {
    if (dbOtp.attempt > 2) {
      OTP.findOneAndDelete({ id: phone || email }).then(() => {
        res.status(429).json({ code: 429, message: "start again" });
      });
    } else {
      dbOtp.updateOne({ attempt: dbOtp.attempt + 1 }).then(() => {
        res.status(400).json({
          code: 400,
          message: "wrong code",
          attempt: dbOtp.attempt + 1,
        });
      });
    }
  }
});
app.patch("/api/userResetPass", async (req, res) => {
  const { phone, email, code, newPass } = req.body;
  const dbOtp = await OTP.findOne({ id: phone || email });
  if (!dbOtp) {
    res.status(404).json({ message: "code does not exists" });
    return;
  }
  if (bcrypt.compareSync(code, dbOtp.code)) {
    bcrypt
      .hash(newPass, 10)
      .then((hash) =>
        User.findOneAndUpdate({ $or: [{ phone }, { email }] }, { pass: hash })
      )
      .then((dbUser) => {
        const user = JSON.parse(JSON.stringify(dbUser));
        signingIn(user, res);
      });
  } else {
    if (dbOtp.attempt > 2) {
      OTP.findOneAndDelete({ id: phone }).then(() => {
        res.status(429).json({ message: "start again" });
      });
    } else {
      dbOtp.updateOne({ attempt: dbOtp.attempt + 1 }).then(() => {
        res
          .status(400)
          .json({ message: "wrong code", attempt: dbOtp.attempt + 1 });
      });
    }
  }
});

app.get(
  "/api/getAllLedgers",
  passport.authenticate("userPrivate"),
  (req, res) => {
    PaymentLedger.find({ user: req.user._id })
      .then((dbRes) => {
        res.json(dbRes);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "something went wrong" });
      });
  }
);
app.get(
  "/api/getSingleLedger",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (req.query._id) {
      PaymentLedger.aggregate([
        { $match: { _id: ObjectId(req.query._id) } },
        {
          $lookup: {
            from: "books",
            as: "bookings",
            localField: "product",
            foreignField: "_id",
          },
        },
        {
          $lookup: {
            from: "chats",
            as: "chats",
            localField: "product",
            foreignField: "_id",
          },
        },
        {
          $lookup: {
            from: "teleconsults",
            as: "tele",
            localField: "product",
            foreignField: "_id",
          },
        },
        {
          $lookup: {
            from: "orders",
            as: "orders",
            localField: "product",
            foreignField: "_id",
          },
        },
        {
          $lookup: {
            from: "diagnosticbookings",
            as: "diagnostics",
            localField: "product",
            foreignField: "_id",
          },
        },
        {
          $set: {
            product: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: [
                        {
                          $size: "$bookings",
                        },
                        1,
                      ],
                    },
                    then: {
                      $first: "$bookings",
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $size: "$orders",
                        },
                        1,
                      ],
                    },
                    then: {
                      $first: "$orders",
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $size: "$chats",
                        },
                        1,
                      ],
                    },
                    then: {
                      $first: "$chats",
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $size: "$tele",
                        },
                        1,
                      ],
                    },
                    then: {
                      $first: "$tele",
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $size: "$diagnostics",
                        },
                        1,
                      ],
                    },
                    then: {
                      $first: "$diagnostics",
                    },
                  },
                ],
                default: null,
              },
            },
          },
        },
        {
          $unset: ["bookings", "chats", "tele", "orders", "diagnostics"],
        },
      ])
        .then((dbRes) => {
          if (dbRes.length) {
            res.json(dbRes[0]);
          } else {
            res.status(400).json({ message: "bad request" });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "something went wrong" });
        });
    } else {
      res.status(400).json({ message: "bad request" });
    }
  }
);