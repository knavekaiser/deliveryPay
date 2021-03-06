app.get("/api/inviteUser", passport.authenticate("userPrivate"), (req, res) => {
  const { q, origin } = req.query;
  const messageBody = `${req.user.firstName} ${req.user.lastName} invites you to join Delivery Pay. Join Delivery Pay to make safe transactions. ${origin}/u/join?referer=${req.user._id}`;
  if (q) {
    sendSms({
      to: q
        .split(",")
        .map((item) => item.replace(/^(\+91|91|1|)(?=\d{10}$)/g, "")),
      message: 128575,
      variables_values: req.user.firstName + " " + req.user.lastName,
    }).then((smsRes) => {
      console.log(smsRes);
      if (smsRes.return) {
        res.json({ code: "ok", message: "invitation sent" });
      } else {
        res.status(424).json({
          code: 424,
          message: "Could not send Invitaion. Please try again.",
        });
      }
    });
  } else {
    res.status(400).json({
      code: 400,
      message: "q and origin is required in the query parameter.",
    });
  }
});

app.get("/api/getUsers", passport.authenticate("userPrivate"), (req, res) => {
  const { q } = req.query;
  const query = {
    _id: { $ne: req.user._id },
    $and: [
      ...req.user.blockList?.map((_id) => ({
        _id: { $not: { $eq: _id } },
      })),
      { _id: { $not: { $eq: req.user._id } } },
    ],
    blockList: { $not: { $in: [ObjectId(req.user._id)] } },
    ...(q && {
      $expr: {
        $regexMatch: {
          input: {
            $concat: [
              "$firstName",
              " ",
              "$lastName",
              " ",
              "$phone",
              " ",
              "$userId",
            ],
          },
          regex: new RegExp(q.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&")),
          options: "i",
        },
      },
    }),
  };
  User.aggregate([
    { $match: query },
    { $limit: 5 },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        profileImg: 1,
        address: 1,
      },
    },
  ])
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "something went wrong" });
    });
});
app.get("/api/getChat", passport.authenticate("userPrivate"), (req, res) => {
  Chat.aggregate([
    {
      $match: { user: req.user._id },
    },
    {
      $lookup: {
        from: "users",
        as: "clientProfile",
        let: { client: "$client" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$client", "$_id"] } } },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              phone: 1,
              email: 1,
              profileImg: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "chats",
        as: "clientChat",
        let: { client: "$client", user: "$user" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$client", "$user"] },
                  { $eq: ["$$user", "$client"] },
                ],
              },
            },
          },
          { $project: { lastSeen: 1 } },
        ],
      },
    },
    {
      $set: {
        client: {
          $mergeObjects: [{ $first: "$clientProfile" }, { _id: "$client" }],
        },
      },
    },
    {
      $set: {
        "client.lastSeen": { $first: "$clientChat.lastSeen" },
        messages: { $slice: ["$messages", -50, 50] },
      },
    },
    { $unset: ["clientProfile", "clientChat"] },
  ])
    .then((dbRes) => {
      const chats = dbRes.map((item) => ({
        ...item,
        userBlock: req.user.blockList?.some(
          (_id) => _id.toString() === item.client._id.toString()
        ),
        clientBlock: item.client.blockList?.some(
          (_id) => _id.toString() === req.user._id.toString()
        ),
      }));
      res.json(chats);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "something went wrong" });
    });
});

// app.post("/sendMessage", passport.authenticate("userPrivate"), (req, res) => {
//   const { to } = req.body;
//   if (ObjectId.isValid(to)) {
//     Chat.updateMany(
//       {
//         user: req.user._id,
//         client: to,
//       },
//       { $push: { messages: req.body } }
//     ).then((dbRes) => {
//       console.log(dbRes);
//       res.json({ code: "ok", message: req.body });
//     });
//   } else {
//     res.status(400).json({ code: 400, message: "to is required" });
//   }
// });

app.get(
  "/api/getMessages",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (ObjectId.isValid(req.query.client)) {
      Chat.aggregate([
        {
          $match: {
            user: req.user._id,
            client: ObjectId(req.query.client),
          },
        },
        {
          $project: {
            messages: { $slice: ["$messages", -(50 * (+req.query.page || 2))] },
            total: { $size: "$messages" },
          },
        },
      ])
        .then((contact) => {
          if (contact.length) {
            res.json({ code: "ok", contact: contact[0] });
          } else {
            res
              .status(400)
              .json({ code: 400, message: "Chat does not exists." });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "Database error" });
        });
    } else {
      res.status(400).json({ code: 400, message: "client is required" });
    }
  }
);

app.patch(
  "/api/updateLastSeen",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (req.body.rooms) {
      Chat.findOneAndUpdate(
        {
          $or: req.body.rooms.map((room) => ({ _id: room })),
          user: req.user._id,
        },
        { lastSeen: new Date() },
        { new: true }
      )
        .then((dbRes) => {
          res.json({ code: "ok", contact: dbRes });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "something went wrong" });
        });
    } else {
      res.status(400).json({ code: 400, message: "rooms is required." });
    }
  }
);

app.patch(
  "/api/blockUser",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (req.body._id) {
      User.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { blockList: req.body._id } },
        { new: true }
      )
        .then((dbRes) => {
          if (dbRes) {
            res.json({ code: "ok", blockList: dbRes.blockList });
          } else {
            res.status(400).json({ code: 400, message: "Could not find user" });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "server error" });
        });
    } else {
      res.status(400).json({ code: 400, message: "_id is required" });
    }
  }
);
app.patch(
  "/api/unblockUser",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (req.body._id) {
      User.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { blockList: req.body._id } },
        { new: true }
      )
        .then((dbRes) => {
          if (dbRes) {
            res.json({ code: "ok", blockList: dbRes.blockList });
          } else {
            res.status(400).json({ code: 400, message: "Could not find user" });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "server error" });
        });
    } else {
      res.status(400).json({ code: 400, message: "_id is required" });
    }
  }
);

global.InitiateChat = async ({ user, client }) => {
  if (user.toString() === client.toString()) {
    throw 403;
  }
  return Promise.all([
    new Chat({ user, client }).save().catch((err) => {
      if (err.code === 11000) {
        return Chat.findOne(
          { user, client },
          "createdAt updatedAt lastSeen user client _id"
        );
      }
    }),
    new Chat({ user: client, client: user }).save().catch((err) => {
      if (err.code === 11000) {
        return Chat.findOne(
          { user: client, client: user },
          "createdAt updatedAt lastSeen user client _id"
        );
      }
    }),
  ]);
};
global.SendMessage = async ({ rooms, message }) => {
  const _id = ObjectId();
  const newMessages = io
    .to(rooms[0]?.toString())
    .to(rooms[1]?.toString())
    .emit("messageToUser", { ...message, _id });
  return Chat.updateMany(
    { $or: rooms.map((room) => ({ _id: room })) },
    { $push: { messages: { ...message, _id } } },
    { new: true }
  ).then((data) => {
    Chat.findOneAndUpdate(
      {
        $or: rooms.map((room) => ({ _id: room })),
        user: message.from,
      },
      { lastSeen: new Date() },
      { new: true }
    ).then((dbRes) => {});
    return data;
  });
};
