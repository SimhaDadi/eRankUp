
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RevisionService } from './src/ai-study/revision.service';
import { UsersService } from './src/users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const revisionService = app.get(RevisionService);
    const usersService = app.get(UsersService);

    const users = await usersService.findAll();
    const student = users[0];
    
    if (student) {
        console.log(`Checking mistakes for user: ${student.email} (${student.id})`);
        const mistakes = await revisionService.getRecentMistakes(student.id, 100); 
        console.log(`Found ${mistakes.length} mistakes in last 100 days.`);
        
        if (mistakes.length > 0) {
            const lastMistake = mistakes[0];
            console.log(`Most recent mistake date: ${lastMistake.answeredAt}`);
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const inLast7Days = mistakes.filter(m => m.answeredAt > sevenDaysAgo);
            console.log(`Found ${inLast7Days.length} mistakes in last 7 days.`);
        }
    } else {
        console.log('No users found.');
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
});
