import { Test, TestingModule } from '@nestjs/testing';
import { PassesController } from './passes.controller';
import { PassesService } from './passes.service';
import { PaymentsService } from '../payments/payments.service';

describe('PassesController', () => {
  let controller: PassesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PassesController],
      providers: [
        {
          provide: PassesService,
          useValue: {
            findAllPasses: jest.fn(),
            getUserPasses: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            createPassOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PassesController>(PassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
