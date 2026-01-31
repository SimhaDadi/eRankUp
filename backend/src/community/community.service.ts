import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(Post) private postRepo: Repository<Post>,
        @InjectRepository(Comment) private commentRepo: Repository<Comment>,
        @InjectRepository(Like) private likeRepo: Repository<Like>,
    ) { }

    async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
        const post = this.postRepo.create({ ...createPostDto, userId });
        return this.postRepo.save(post);
    }

    async getFeed(userId: string, page: number = 1, limit: number = 20, category?: string) {
        const query = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'user')
            .loadRelationCountAndMap('post.likesCount', 'post.likes')
            .loadRelationCountAndMap('post.commentsCount', 'post.comments')
            .orderBy('post.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (category && category !== 'All') {
            query.where('post.category = :category', { category });
        }

        const posts = await query.getMany();

        // Check if current user liked these posts
        const postIds = posts.map(p => p.id);
        if (postIds.length > 0) {
            const userLikes = await this.likeRepo.createQueryBuilder('like')
                .where('like.userId = :userId', { userId })
                .andWhere('like.postId IN (:...postIds)', { postIds })
                .getMany();

            const likedMap = new Set(userLikes.map(l => l.postId));

            return posts.map(post => ({
                ...post,
                isLiked: likedMap.has(post.id)
            }));
        }

        return posts.map(post => ({ ...post, isLiked: false }));
    }

    async toggleLike(userId: string, postId: string) {
        const existing = await this.likeRepo.findOne({ where: { userId, postId } });
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        if (existing) {
            await this.likeRepo.remove(existing);
            post.likesCount = Math.max(0, post.likesCount - 1);
        } else {
            const like = this.likeRepo.create({ userId, postId });
            await this.likeRepo.save(like);
            post.likesCount += 1;
        }
        await this.postRepo.save(post);
        return { isLiked: !existing, likesCount: post.likesCount };
    }

    async addComment(userId: string, postId: string, content: string) {
        const comment = this.commentRepo.create({ userId, postId, content });
        await this.commentRepo.save(comment);

        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (post) {
            post.commentsCount += 1;
            await this.postRepo.save(post);
        }

        // Return full comment with user
        return this.commentRepo.findOne({
            where: { id: comment.id },
            relations: ['user']
        });
    }

    async getComments(postId: string) {
        return this.commentRepo.find({
            where: { postId },
            order: { createdAt: 'ASC' },
            relations: ['user']
        });
    }
}
