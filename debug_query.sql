SELECT e.id, e.title, e."isPremium" FROM exam e JOIN exam_models em ON e.id = em."examId" WHERE em."modelId" = '156700c1-1edc-4f75-a33c-f1a67d952766';
