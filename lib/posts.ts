import { glob } from "glob";
import matter from "gray-matter";
import fs from "fs/promises";
import { getTopicTags } from "./tags";

export interface PostMetadata {
	date: string;
	title: string;
	tags: string;
}

export interface Post {
	slug: string;
	markdownBody: string;
	frontmatter: PostMetadata;
	tags: string[];
}

export const isPublicPost = (post: Post) => !post.slug.startsWith("_");

export const getPosts = async () => {
	const files = await glob("content/posts/*.md");
	const postPromises = files.map(async (filepath): Promise<Post> => {
		const slug = filepath
			.replace(/^.*[\\\/]/, "")
			.split(".")
			.slice(0, -1)
			.join(".");

		const rawContents = await fs.readFile(filepath);

		const post = matter(rawContents);

		const tags: string[] =
			post.data.tags?.split(",").map((tag: string) => tag.trim()) || [];

		return {
			slug,
			markdownBody: post.content,
			frontmatter: post.data as PostMetadata,
			tags,
		};
	});

	const posts = await Promise.all(postPromises);
	return posts.sort((a, b) =>
		a.frontmatter.date < b.frontmatter.date ? 1 : -1
	);
};

export const getPublishedPosts = async () =>
	(await getPosts()).filter(isPublicPost);

export const getPostsMatchingInterests = async (tags: string[]) => {
	const allPosts = await getPosts();

	const allRelevantTags = (await getTopicTags()).map(({ tag }) => tag);

	const matchingPosts = allPosts.filter((post) => {
		return post.tags.some((tag) => allRelevantTags.includes(tag.toLowerCase()));
	});

	return matchingPosts;
};
