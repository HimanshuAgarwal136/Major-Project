import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import natural from "natural";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tokenizer = new natural.WordTokenizer();

export const createListing = async (req, res, next) => {
  try {
    const { name, area, bedrooms, features, type } = req.body;

    // Generate AI description
    const prompt = `Generate a compelling real estate description for a property named "${name}". It has ${bedrooms} bedrooms and features ${features.join(", ")}. The type of listing is "${type}".`;
    
    const aiResponse = await openai.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 100,
    });

    const description = aiResponse.choices[0].message.content.trim();

    // Create new listing with AI-generated description
    const listing = await Listing.create({
      name,
      area,
      bedrooms,
      features,
      type,
      description, // Automatically set AI-generated description
    });

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, "Listing not found"));

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(403, "You can only delete your own listings"));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json("Listing has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return next(errorHandler(404, "Listing not found"));

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(403, "You can only update your own listings"));
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, "Listing not found!"));

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const searchTerm = req.query.searchTerm || "";
    const sort = req.query.sort || "createdAt";
    const order = req.query.order || "desc";

    let offer = req.query.offer === "true" ? true : { $in: [false, true] };
    let furnished = req.query.furnished === "true" ? true : { $in: [false, true] };
    let parking = req.query.parking === "true" ? true : { $in: [false, true] };
    let type = req.query.type === "all" ? { $in: ["sale", "rent"] } : req.query.type;

    // Process search term using NLP
    const keywords = tokenizer.tokenize(searchTerm.toLowerCase());

    const listings = await Listing.find({
      $or: [
        { name: { $regex: keywords.join("|"), $options: "i" } },
        { description: { $regex: keywords.join("|"), $options: "i" } },
      ],
      offer,
      furnished,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};





// import Listing from "../models/listing.model.js";
// import { errorHandler } from "../utils/error.js";

// export const createListing = async (req, res, next) => {
//   try {
//     const listing = await Listing.create(req.body);
//     return res.status(201).json(listing);
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteListing = async (req, res, next) => {
//   const listing = await Listing.findById(req.params.id);
//   if (!listing) return next(errorHandler(404, "Listing not found"));

//   if (req.user.id !== listing.userRef) {
//     return next(errorHandler(403, "You can only delete your own listings"));
//   }

//   try {
//     await Listing.findByIdAndDelete(req.params.id);
//     res.status(200).json("Listing has been deleted!");
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateListing = async (req, res, next) => {
//   const listing = await Listing.findById(req.params.id);
//   if (!listing) return next(errorHandler(404, "Listing not found"));

//   if (req.user.id !== listing.userRef) {
//     return next(errorHandler(403, "You can only update your own listings"));
//   }

//   try {
//     const updatedListing = await Listing.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );
//     res.status(200).json(updatedListing);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getListing = async (req, res, next) => {
//   try {
//     const listing = await Listing.findById(req.params.id);
//     if (!listing) return next(errorHandler(404, "Listing not found!"));

//     res.status(200).json(listing);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getListings = async (req, res, next) => {
//   try {
//     const limit = parseInt(req.query.limit) || 9;

//     const startIndex = parseInt(req.query.startIndex) || 0;

//     let offer = req.query.offer;

//     if (offer === undefined || offer === "false") {
//       offer = { $in: [false, true] };
//     }

//     let furnished = req.query.furnished;

//     if (furnished === undefined || furnished === "false") {
//       furnished = { $in: [false, true] };
//     }

//     let parking = req.query.parking;

//     if (parking === undefined || parking === "false") {
//       parking = { $in: [false, true] };
//     }

//     let type = req.query.type;

//     if (type === undefined || type === "all") {
//       type = { $in: ["sale", "rent"] };
//     }

//     const searchTerm = req.query.searchTerm || "";

//     const sort = req.query.sort || "createdAt";

//     const order = req.query.order || "desc";

//     const listings = await Listing.find({
//       name: { $regex: searchTerm, $options: "i" },
//       offer,
//       furnished,
//       type,
//       // parking,
//     })
//       .sort({ [sort]: order })
//       .limit(limit)
//       .skip(startIndex);

//     return res.status(200).json(listings);
//   } catch (error) {
//     next(error);
//   }
// };
