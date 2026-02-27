import { AppDataSource } from '../data-source';
import { QuestionExplanation } from '../ai/entities/question-explanation.entity';
import { Like } from 'typeorm';

async function run() {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!');

    const explanationRepo = AppDataSource.getRepository(QuestionExplanation);

    // Find how many corrupted records exist
    const count = await explanationRepo.count({
        where: { aiExplanation: Like('%AI Generation is temporarily unavailable%') }
    });

    console.log(`Found ${count} cached error explanations.`);

    if (count > 0) {
        console.log('Deleting corrupted cache records...');
        await explanationRepo.delete({
            aiExplanation: Like('%AI Generation is temporarily unavailable%')
        });
        console.log('Deleted successfully. The web app should now retry generation properly.');
    }

    await AppDataSource.destroy();
}

run().catch(console.error);
