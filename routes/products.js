const fs = require("fs");
const { FB } = require("fb");
// const React = require("react");
// const ReactDOMServer = require("react-dom/server");

app.get("/api/products", passport.authenticate("userPrivate"), (req, res) => {
  const {
    q,
    page,
    perPage,
    sort,
    order,
    category,
    dateFrom,
    dateTo,
    type,
  } = req.query;
  const query = {
    user: req.user._id,
    ...(q && { name: new RegExp(q, "gi") }),
    ...(dateFrom &&
      dateTo && {
        createdAt: {
          $gte: new Date(`${dateFrom} 0:0`),
          $lt: new Date(`${dateTo} 0:0`),
        },
      }),
    ...(category && { category }),
    ...(type && { type }),
  };
  const sortOrder = {
    [sort || "createdAt"]: order === "asc" ? 1 : -1,
  };
  Product.aggregate([
    { $match: query },
    { $sort: sortOrder },
    {
      $facet: {
        products: [
          { $skip: +perPage * (+(page || 1) - 1) },
          { $limit: +(perPage || 20) },
        ],
        total: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    },
    { $set: { total: { $first: "$total.count" } } },
  ])
    .then(([{ products, total }]) => {
      res.json({
        code: "ok",
        products,
        total: total || 0,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "database error" });
    });
});
app.post(
  "/api/addProduct",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { type, name, dscr, images, price, category } = req.body;
    if (type && name && price && dscr && category) {
      Product.find({ user: req.user._id })
        .countDocuments()
        .then((num) => {
          if (num < 100) {
            new Product({
              ...req.body,
              images: [
                "https://images.unsplash.com/photo-1628191079535-d1900add3533?ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80",
              ],
              user: req.user._id,
            })
              .save()
              .then((product) => {
                if (
                  req.user.fbMarket?.user?.access_token &&
                  req.user.fbMarket?.commerceAccount?.catalog?.id
                ) {
                  FB.setAccessToken(req.user.fbMarket.user.access_token);
                  addToFbMarket(
                    [product],
                    req.user.fbMarket.commerceAccount.catalog.id,
                    req.user._id
                  ).then((fbRes) => {
                    res.json({ code: "ok", product, fbMarket: fbRes });
                  });
                } else {
                  res.json({ code: "ok", product });
                }
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({ code: 500, message: "database error" });
              });
          } else {
            res.status(403).json({ code: 403, message: "100 product at max" });
          }
        });
    } else {
      res.status(400).json({
        code: 400,
        message: "type, name, price, dscr is required",
        fieldsFound: req.body,
      });
    }
  }
);
app.post(
  "/api/addManyProducts",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const newProducts =
      req.body.items?.map(
        (item) => new Product({ ...item, user: req.user._id })
      ) || [];
    if (newProducts.length) {
      Product.insertMany(newProducts, { ordered: false })
        .then((dbRes) => {
          res.json({ code: "ok", products: dbRes });
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      res.status(400).json({
        code: 400,
        message:
          "items is required. Make sure data structure of all the products are currect",
      });
    }
  }
);
app.patch(
  "/api/editProduct",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { _id } = req.body;
    if (_id) {
      Product.findOneAndUpdate(
        { _id, user: req.user._id },
        { ...req.body },
        { new: true }
      )
        .then((product) => {
          if (product) {
            res.json({ code: "ok", product });
          } else {
            res.status(400).json({ code: "400", message: "bad request" });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "database error" });
        });
    } else {
      res.status(400).json({
        code: 400,
        message: "_id is required",
        fieldsFound: req.body,
      });
    }
  }
);
app.delete(
  "/api/deleteProducts",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { _ids } = req.body;
    if (_ids) {
      Product.deleteMany({
        _id: { $in: _ids },
        user: req.user._id,
      }).then((deleted) => {
        if (deleted) {
          res.json({ code: "ok", product: deleted });
        } else {
          res.status(400).json({ code: 400, message: "bad request" });
        }
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "_ids is required",
        fieldsFound: req.body,
      });
    }
  }
);

app.post(
  "/api/uploadProductImg",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { category, images, type } = req.body;
    if (category && images) {
      const products = images.map(
        (img, i) =>
          new Product({
            type: type || "product",
            user: req.user._id,
            name: "Product draft" + i,
            dscr: "Product draft" + i,
            category,
            images: [img],
            price: 0,
            status: "draft",
          })
      );
      Product.insertMany(products)
        .then((dbRes) => {
          res.json({
            code: "ok",
            products: dbRes.map((item) => ({
              _id: item._id,
              images: item.images,
              name: item.name,
              dscr: item.dscr,
              material: item.material,
              size: item.size,
              category: item.category,
              type: item.type,
              price: item.price,
              available: item.available,
              hsn: item.hsn,
              gst: item.gst,
            })),
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "Databaser error" });
        });
    } else {
      res
        .status(400)
        .json({ code: 400, message: "category, images are required" });
    }
  }
);
app.patch(
  "/api/updateDraft",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { items } = req.body;
    if (Array.isArray(items) && items.length > 0) {
      const products = items.map((item) => ({
        updateOne: {
          filter: { _id: ObjectId(item._id) },
          update: { ...item },
          upsert: false,
        },
      }));
      Product.bulkWrite(products, { ordered: false, new: true })
        .then((dbRes) => {
          res.json({ code: "ok", updated: dbRes.result?.nModified || 0 });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "Database error" });
        });
    } else {
      res.status(400).json({
        code: 400,
        message: "items with at least one product is required.",
      });
    }
  }
);

app.get("/api/getProducts", (req, res) => {
  const { seller, buyer, q, page, perPage, sort, order, category } = req.query;
  const sortOrder = {
    [sort || "popularity"]: order === "dsc" ? -1 : 1,
  };
  const user = req.cookies?.access_token
    ? jwt_decode(req.cookies?.access_token)?.sub
    : null;
  const query = {
    status: { $ne: "draft" },
    ...(user && { user: { $not: { $eq: ObjectId(user) } } }),
    ...(ObjectId.isValid(seller) && { user: ObjectId(seller) }),
    ...(q && {
      $or: [
        { name: new RegExp(q, "gi") },
        { dscr: new RegExp(q, "gi") },
        { tags: { $in: [q] } },
      ],
    }),
    ...(category && { category: new RegExp(category, "gi") }),
  };
  Product.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "sellerGst",
      },
    },
    {
      $set: {
        sellerGst: { $first: "$sellerGst.gst" },
        seller_id: { $first: "$sellerGst._id" },
      },
    },
    {
      $set: {
        gst: {
          $cond: {
            if: {
              $and: [
                { $eq: ["$sellerGst.verified", true] },
                { $isNumber: "$gst" },
              ],
            },
            then: "$gst",
            else: "$sellerGst.amount",
          },
        },
        "user.gst": "$sellerGst",
        "user._id": "$seller_id",
      },
    },
    { $unset: ["sellerGst", "seller_id"] },
    { $sort: sortOrder },
    {
      $facet: {
        products: [
          { $skip: +perPage * (+(page || 1) - 1) },
          { $limit: +(perPage || 20) },
        ],
        total: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    },
    { $set: { total: { $first: "$total.count" } } },
  ])
    .then(async ([{ products, total }]) => {
      res.json({
        code: "ok",
        products,
        total: total || 0,
        ...(ObjectId.isValid(seller) && {
          seller: await User.findOne(
            { _id: seller },
            "firstName lastName phone email profileImg shopInfo"
          ),
          categories: await Category.findOne({ user: seller }).then(
            (dbRes) => dbRes?.categories || null
          ),
        }),
        ...(ObjectId.isValid(buyer) && {
          buyer: await User.findOne(
            { _id: buyer },
            "firstName lastName phone email profileImg"
          ),
        }),
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/api/singleProduct", (req, res) => {
  if (ObjectId.isValid(req.query._id)) {
    Product.findOne({ _id: req.query._id })
      .populate(
        "user",
        "firstName lastName phone email profileImg gst shopInfo"
      )
      .then((product) => {
        if (product) {
          res.json({ code: "ok", product });
        } else {
          res
            .status(404)
            .json({ code: 404, message: "product could not be found" });
        }
      });
  } else {
    res.status(400).json({ code: 400, message: "Valid _id is required." });
  }
});

app.post(
  "/api/shareProducts",
  passport.authenticate("userPrivate"),
  async (req, res) => {
    const { products, pages, igs, groups } = req.body;
    if (products?.forEach) {
      FB.setAccessToken(req.user.fbMarket?.user?.access_token);
      res.json({ code: "ok", message: "Product is being shared" });
      products.forEach(async (product_id, i) => {
        const product = await Product.findOne(
          { _id: product_id },
          "images _id fbMarketId"
        );
        pages.forEach(async ({ id, access_token }, j) => {
          FB.setAccessToken(access_token);
          await FB.api(`/${id}/feed`, "POST", {
            link: product.fbMarketId
              ? `https://www.facebook.com/marketplace/item/${product_id}`
              : `https://deliverypay.in/marketplace/${product_id}`,
          })
            .then((value) => {})
            .catch((err) => {
              console.log("page err:", err?.response);
            });
        });
        igs.forEach(async ({ id }, i) => {
          FB.setAccessToken(req.user.fbMarket?.user?.access_token);
          await FB.api(`/${id}/media`, "POST", {
            image_url: product.images[0],
          })
            .then(async (result) => {
              if (!result || result.error) {
                return;
              }
              await FB.api(`${id}/media_publish`, "POST", {
                creation_id: result.id,
              });
            })
            .catch((err) => {
              console.log("ig err:", err?.response);
            });
        });
        groups.forEach(async ({ id }, i) => {
          FB.setAccessToken(req.user.fbMarket?.user?.access_token);
          await FB.api(`${id}/feed`, "post", {
            link: ObjectId.isValid(product_id)
              ? `https://deliverypay.in/marketplace/${product_id}`
              : `https://www.facebook.com/marketplace/item/${product_id}`,
          })
            .then((resp) => {})
            .catch((err) => {
              console.log("group err:", err?.response);
            });
        });
      });
    } else {
      res.status(400).json({ code: 400, message: "products is required." });
    }
  }
);

app.post(
  "/api/getCartDetail",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { cart } = req.body;
    if (Array.isArray(cart)) {
      if (!cart.length) {
        res.json({
          code: "ok",
          carts: [],
        });
        return;
      }
      Product.aggregate([
        {
          $match: {
            $or: cart.map((item) => ({ _id: ObjectId(item.product._id) })),
          },
        },
        {
          $group: {
            _id: "$user",
            products: {
              $push: {
                _id: "$_id",
                name: "$name",
                images: "$images",
                dscr: "$dscr",
                price: "$price",
                discount: "$discount",
                createdAt: "$createdAt",
                gst: "$gst",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $set: { seller: { $first: "$seller" } } },
        {
          $project: {
            products: 1,
            _id: 0,
            "seller._id": 1,
            "seller.firstName": 1,
            "seller.lastName": 1,
            "seller.phone": 1,
            "seller.email": 1,
            "seller.profileImg": 1,
            "seller.gst": 1,
            "seller.rating": 1,
            "seller.shopInfo": 1,
          },
        },
        {
          $match: {
            "seller._id": { $not: { $eq: req.user._id } },
          },
        },
      ]).then((dbRes) => {
        if (dbRes.length) {
          res.json({
            code: "ok",
            carts: dbRes.map((shop) => ({
              ...shop,
              products: shop.products.map((product) => ({
                product,
                qty: cart.find(
                  (item) =>
                    item.product._id.toString() === product._id.toString()
                )?.qty,
              })),
            })),
          });
        } else {
          res.status(400).json({ code: 400, message: "no product found" });
        }
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "Cart with at least one item is required",
      });
    }
  }
);
app.post(
  "/api/getSellerCartDetail",
  passport.authenticate("userPrivate"),
  async (req, res) => {
    const { cart } = req.body;
    if (Array.isArray(cart)) {
      if (!cart.length) {
        res.json({
          code: "ok",
          carts: [],
        });
        return;
      }
      const buyers = {};
      cart.forEach(({ buyer, product, qty }, i) => {
        if (buyers[buyer]) {
          buyers[buyer].push({ product, qty });
        } else {
          buyers[buyer] = [{ product, qty }];
        }
      });
      const orders = await Promise.all(
        Object.entries(buyers).map(async ([buyer_id, products]) => {
          const buyer = await User.findOne(
            { _id: buyer_id },
            "firstName lastName phone email address"
          );
          const productDetails = await Product.aggregate([
            {
              $match: {
                $or: products.map((item) => ({
                  _id: ObjectId(item.product._id),
                })),
              },
            },
          ]);
          return {
            buyer,
            products: productDetails.map((product) => ({
              product,
              qty: products.find(
                (item) =>
                  item.product._id.toString() === product._id?.toString()
              )?.qty,
            })),
          };
        })
      );
      res.json({
        code: "ok",
        carts: orders,
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "Cart with at least one item is required",
      });
    }
  }
);

app.post(
  "/api/addCategory",
  passport.authenticate("userPrivate"),
  (req, res) => {
    if (req.body.category?.trim()) {
      Category.findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { categories: req.body.category.trim() } },
        { new: true }
      )
        .then((dbRes) => {
          if (dbRes) {
            res.json({ code: "ok", categories: dbRes.categories });
          } else {
            new Category({
              user: req.user._id,
              categories: [req.body.category.trim()],
            })
              .save()
              .then((dbRes) => {
                res.json({ code: "ok", categories: dbRes.categories });
              });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ code: 500, message: "Datebase error" });
        });
    } else {
      res.status(400).json({ code: 400, message: "category is required" });
    }
  }
);
app.get("/api/categories", passport.authenticate("userPrivate"), (req, res) => {
  Category.findOne({ user: req.user._id })
    .then((dbRes) => {
      res.json({ code: "ok", categories: dbRes?.categories || [] });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ code: 500, message: "Database error" });
    });
});
app.delete(
  "/api/categories",
  passport.authenticate("userPrivate"),
  (req, res) => {
    Category.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { categories: req.body.category } },
      { new: true }
    )
      .then((dbRes) => {
        if (dbRes) {
          res.json({ code: "ok", categories: dbRes.categories });
        } else {
          res
            .status(400)
            .json({ code: 400, message: "Could not find category" });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ code: 500, message: "Database error" });
      });
  }
);

app.post(
  "/api/addFbMarketUser",
  passport.authenticate("userPrivate"),
  async (req, res) => {
    const { accessToken } = req.body;
    if (accessToken) {
      FB.setAccessToken(accessToken);
      const fbUserData = await FB.api("/me", "GET", {
        fields: "name,picture.type(large){url}",
      });
      FB.api(
        `/oauth/access_token`,
        "GET",
        {
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: accessToken,
        },
        (fbRes) => {
          if (fbRes.access_token) {
            User.findOneAndUpdate(
              { _id: req.user._id },
              {
                "fbMarket.user.name": fbUserData.name,
                "fbMarket.user.id": fbUserData.id,
                "fbMarket.user.profileImg": fbUserData.picture.data.url,
                "fbMarket.user.access_token": fbRes.access_token,
              },
              { new: true }
            ).then((dbRes) => {
              if (dbRes) {
                res.json({ code: "ok", fbMarket: dbRes.fbMarket });
              }
            });
            return;
          }
          res.status(424).json({
            code: 424,
            message: "Facebook failed to response",
            fbResp: fbRes,
          });
        }
      );
    } else {
      res.status(400).json({ code: 400, message: "accessToken is required" });
    }
  }
);

const addToFbMarket = async (products, catalogId) => {
  const fb_products = [];
  for (var i = 0; i < products.length; i++) {
    const item = products[i];
    await FB.api(`/${catalogId}/products`, "POST", {
      currency: "INR",
      name: item.name,
      price: item.price * 100,
      price_amount: item.price * 100,
      image_url: item.images[0],
      category: item.category,
      brand: item.brand || "none",
      retailer_id: item._id,
      url: `https://deliverypay.in/marketplace/${item._id}`,
      description: item.dscr,
    })
      .then(async (data) => {
        await Product.findOneAndUpdate(
          { _id: item._id },
          { fbMarketId: data.id },
          { new: true }
        ).then((dbProduct) => {
          fb_products.push({
            _id: dbProduct._id,
            name: item.name,
            success: true,
            fbMarketId: dbProduct.fbMarketId,
          });
        });
      })
      .catch((error) => {
        if (error) {
          console.log(error);
          fb_products.push({
            _id: item._id,
            name: item.name,
            success: false,
            error: error.error_user_msg || error.message,
          });
          return;
        }
      });
  }
  return fb_products;
};
const removeFromFbMarket = async (products) => {
  const fb_products = [];
  for (var i = 0; i < products.length; i++) {
    const item = products[i];
    await FB.api(`/${item.fbMarketId}`, "DELETE")
      .then(async (data) => {
        await Product.findOneAndUpdate(
          { _id: item._id },
          { fbMarketId: null },
          { new: true }
        ).then((dbProduct) => {
          fb_products.push({
            _id: dbProduct._id,
            name: item.name,
            success: true,
          });
        });
      })
      .catch((error) => {
        if (error) {
          console.log(error);
          fb_products.push({
            _id: item._id,
            name: item.name,
            success: false,
            error: error.error_user_msg || error.message,
          });
          return;
        }
      });
  }
  return fb_products;
};

app.put(
  "/api/addToFbMarket",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { _ids } = req.body;
    if (Array.isArray(_ids) && _ids.length > 0) {
      Product.find({
        $or: _ids.map((_id) => ({ _id })),
        user: req.user._id,
      }).then(async (products) => {
        FB.setAccessToken(req.user.fbMarket.user.access_token);
        const fb_products = await addToFbMarket(
          products,
          req.user.fbMarket.commerceAccount.catalog.id,
          req.user._id
        );
        res.json({
          code: "ok",
          fb_products,
        });
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "_ids with at least 1 product _id is required.",
      });
    }
  }
);
app.put(
  "/api/postToInstagram",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { img, caption } = req.body;
    if (!user.fbMarket?.instagramAccount) {
      res.status(400).json({
        code: 400,
        message: "user does not have instagram account connected",
      });
      return;
    }
    if (img && caption) {
      FB.setAccessToken(req.user.fbMarket?.user?.access_token);
      FB.api(
        `${user.fbMarket?.instagramAccount.id}/media`,
        "post",
        { caption: caption, image_url: img },
        function (result) {
          if (!result || result.error) {
            res.status(424).json({ code: 424, message: result.error.message });
            return;
          }
          FB.api(
            `${instagram_id}/media_publish`,
            "post",
            { creation_id: res.id },
            function (result) {
              if (!result || result.error) {
                res
                  .status(424)
                  .json({ code: 424, message: result.error.message });
                return;
              }
              res.json({ code: "ok", result });
            }
          );
        }
      );
    } else {
      res.status(400).json({
        code: 400,
        message: "img, caption is required",
      });
    }
  }
);

app.delete(
  "/api/removeFromFbMarket",
  passport.authenticate("userPrivate"),
  (req, res) => {
    const { _ids } = req.body;
    if (Array.isArray(_ids) && _ids.length > 0) {
      Product.find({
        $or: _ids.map((_id) => ({ _id })),
        user: req.user._id,
      }).then(async (products) => {
        FB.setAccessToken(req.user.fbMarket?.user?.access_token);
        const fb_products = await removeFromFbMarket(
          products,
          req.user.fbMarket.commerceAccount.catalog.id,
          req.user._id,
          req.body.access_token
        );
        res.json({
          code: "ok",
          fb_products,
        });
      });
    } else {
      res.status(400).json({
        code: 400,
        message: "_ids with at least 1 product _id is required.",
      });
    }
  }
);
