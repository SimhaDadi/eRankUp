import { Test, TestingModule } from '@nestjs/testing';
import { PassesService } from './passes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Pass } from './entities/pass.entity';
import { UserPass } from './entities/user-pass.entity';

describe('PassesService', () => {
  let service: PassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PassesService,
        {
          provide: getRepositoryToken(Pass),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserPass),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            manager: { getRepository: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PassesService>(PassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
