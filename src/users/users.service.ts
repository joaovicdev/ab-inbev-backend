import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  private readonly cacheKey = 'users';

  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.repo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already exists');

    const user = this.repo.create(dto);
    const savedUser = await this.repo.save(user);

    await this.cache.del(this.cacheKey);

    return savedUser;
  }

  async findAll() {
    const cachedUsers = await this.cache.get<User[]>(this.cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.repo.find();
    await this.cache.set(this.cacheKey, users, 60);
    return users;
  }

  async findOne(id: number) {
    const key = `users:${id}`;
    let user = await this.cache.get<User>(key);
    if (user) return user;

    user = await this.repo.findOneBy({ id });
    if (user) await this.cache.set(key, user, 60);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new ConflictException('User not found');
    this.repo.merge(user, updateUserDto);

    const updatedUser = await this.repo.save(user);
    await this.cache.del(this.cacheKey);
    return updatedUser;
  }

  async remove(id: number) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new ConflictException('User not found');
    const result = await this.repo.delete(id);

    await this.cache.del(this.cacheKey);
    return result;
  }
}
