'use client';
import parse from 'html-react-parser';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';


interface BlogPost {
  title: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

export default function BlogDetails({ post }: { post: BlogPost }) {
  if (!post) return <div className="text-center py-10">Loading blog post...</div>;

  // Structured Data (JSON-LD) for the blog post
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.imageUrl || '', // Use the post's image if available
    datePublished: post.createdAt,
    dateModified: post.createdAt, // Update this if you modify the post later
    author: {
      '@type': 'Person',
      name: 'Author Name', // Replace with actual author's name if available
    },
    description: post.content.slice(0, 150), // First 150 characters as description
    articleBody: post.content,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 mt-20 md:mt-20">
      {/* Add structured data using next/head */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 md:mt-20 lg:mt-20">
        

        {post.imageUrl && (
          <div className="w-full h-[300px]  md:h-[550px] lg:h-[500px] relative">
            
            <Image
              src={post.imageUrl}
              alt={post.title}
              layout="fill"
              objectFit="cover"
              unoptimized
              className="rounded-xl shadow-md "
            />
          </div>
        )}
        <div className="flex flex-col justify-center">
<nav
  className="inline-block text-sm text-gray-600 mb-4"
  aria-label="Breadcrumb"
>
  <ol className="inline-flex items-center space-x-1 sm:space-x-2">
    <li>
      <Link href="/" className="text-blue-600 hover:underline">Home</Link>
    </li>
    <li>/</li>
    <li>
      <Link href="/blog" className="text-blue-600 hover:underline">Blog</Link>
    </li>
  </ol>
</nav>



          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <p className="text-gray-500 text-sm">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="mt-10 prose max-w-none prose-p:leading-7 prose-p:mb-4 prose-a:text-blue-600">
      {parse(post.content, {
  replace: (domNode: any) => {
    if (domNode.name === 'img') {
      return (
        <img
          src={domNode.attribs.src}
          alt={domNode.attribs.alt || ''}
          className="max-w-[600px] w-full h-auto rounded-xl shadow-md my-4 mx-auto"
        />
      );
    }
    if (domNode.name === 'a') {
      return (
        <a
          href={domNode.attribs.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600  hover:text-blue-800 transition-colors"
        >
          {domNode.children[0]?.data}
        </a>
      );
    }
  },
})}


      </div>
    </div>
  );
}