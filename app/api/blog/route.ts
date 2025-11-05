  
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import slugify from "slugify";
import { ObjectId } from "mongodb";
import sanitizeHtml from "sanitize-html";
import { dbPromise } from "../lib/mongodb";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_SECRET_KEY!,
});

// Convert ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) chunks.push(value);
    done = readerDone;
  }

  return Buffer.concat(chunks);
}

// Upload to Cloudinary
async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error("❌ Error uploading image:", error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        }
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// Sanitize HTML
const sanitize = (input: string) =>
  sanitizeHtml(input, {
    allowedTags: ["b", "i", "em", "strong", "a", "ul", "ol", "li", "p", "br", "img"],
    allowedAttributes: {
      a: ["href", "target"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "data"],
  });

/* =========================
   CREATE BLOG POST (POST)
========================= */
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const title = sanitize(form.get("title")?.toString() || "");
    const content = sanitize(form.get("content")?.toString() || "");
    const metaTitle = sanitize(form.get("metaTitle")?.toString() || "");
    const metaDescription = sanitize(form.get("metaDescription")?.toString() || "");
    const author = form.get("author")?.toString() || "";
    const category = form.get("category")?.toString() || "";

    const slug = slugify(title || "untitled", { lower: true, strict: true });

    // Handle image upload if present
    let imageUrl = "";
    const imageFile = form.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buffer = await streamToBuffer(imageFile.stream());
      imageUrl = await uploadToCloudinary(buffer, "blog");
    }

    const db = await dbPromise;

    const result = await db.collection("blog").insertOne({
      title,
      content,
      metaTitle,
      metaDescription,
      author,
      category,
      slug,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Blog post created successfully", data: { id: result.insertedId.toString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}

/* =========================
   FETCH BLOG POSTS (GET)
========================= */


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const limit = searchParams.get("limit");
    const page = searchParams.get("page");
    const category = searchParams.get("category");

    const db = await dbPromise;
    const query: Record<string, string> = {};

    if (category) query.category = category;

    // ✅ Fetch single post by ID
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
      }

      const post = await db.collection("blog").findOne({ _id: new ObjectId(id) });
      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }

      const relatedPosts = await db
        .collection("blog")
        .find({ category: post.category, _id: { $ne: post._id } })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      // ✅ Add `id` for React Admin
      return NextResponse.json({
        data: {
          post: { ...post, id: post._id.toString() },
          relatedPosts: relatedPosts.map((r) => ({
            ...r,
            id: r._id.toString(),
          })),
        },
      });
    }

    // ✅ Fetch single post by slug
    if (slug) {
      const post = await db.collection("blog").findOne({ slug });
      if (!post) {
        return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
      }

      const relatedPosts = await db
        .collection("blog")
        .find({ category: post.category, _id: { $ne: post._id } })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      return NextResponse.json({
        data: {
          post: { ...post, id: post._id.toString() },
          relatedPosts: relatedPosts.map((r) => ({
            ...r,
            id: r._id.toString(),
          })),
        },
      });
    }

    // ✅ Paginated or all posts
    const isPaginated = limit !== null || page !== null;
    let posts = [];
    let totalPosts = 0;

    if (isPaginated) {
      const limitNum = Number(limit || 10);
      const pageNum = Number(page || 1);
      const skip = (pageNum - 1) * limitNum;

      totalPosts = await db.collection("blog").countDocuments(query);
      posts = await db
        .collection("blog")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();
    } else {
      posts = await db.collection("blog").find(query).sort({ createdAt: -1 }).toArray();
      totalPosts = posts.length;
    }

    // ✅ Convert `_id` → `id` for React Admin
    return NextResponse.json({
      data: posts.map((post) => ({
        ...post,
        id: post._id.toString(),
      })),
      total: totalPosts,
    });
  } catch (error) {
    console.error("❌ Error fetching blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

/* =========================
   DELETE BLOG POST
========================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json();
      id = body.id;
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing blog ID" }, { status: 400 });
    }

    const db = await dbPromise;

    const post = await db.collection("blog").findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    if (post.imageUrl) {
      const publicId = post.imageUrl.split("/").pop()?.split(".")[0];
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    const result = await db.collection("blog").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting blog post:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}

/* =========================
   UPDATE BLOG POST (PUT)
========================= */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid blog ID" }, { status: 400 });
    }

    const form = await req.formData();

    const title = sanitize(form.get("title")?.toString() || "");
    const content = sanitize(form.get("content")?.toString() || "");
    const metaTitle = sanitize(form.get("metaTitle")?.toString() || "");
    const metaDescription = sanitize(form.get("metaDescription")?.toString() || "");
    const author = form.get("author")?.toString() || "";
    const category = form.get("category")?.toString() || "";
    const slug = slugify(title || "untitled", { lower: true, strict: true });

    let imageUrl = "";
    const imageFile = form.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const buffer = await streamToBuffer(imageFile.stream());
      imageUrl = await uploadToCloudinary(buffer, "blog");
    }

    const db = await dbPromise;

    const updateFields: any = {
      title,
      content,
      metaTitle,
      metaDescription,
      author,
      category,
      slug,
      updatedAt: new Date(),
    };

    if (imageUrl) updateFields.imageUrl = imageUrl;

    const result = await db.collection("blog").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Blog post updated successfully",
      data: { id, ...updateFields },
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}
