import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    // Check for duplicate slug
    const existing = await this.categoryRepository.findOne({ where: { slug: createCategoryDto.slug } });
    if (existing) {
      throw new BadRequestException('Category with this slug already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  findAll(includeHidden = false) {
    const query = this.categoryRepository.createQueryBuilder('category')
      .orderBy('category.order', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (!includeHidden) {
      query.where('category.isVisible = :visible', { visible: true });
    }

    return query.getMany();
  }

  findOne(id: string) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.categoryRepository.update(id, updateCategoryDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.categoryRepository.delete(id);
  }
}
