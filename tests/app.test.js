
import { VibeCodingNotes } from '../src/scripts/js/App.js';

console.log('Running tests...');

try {
    const app = new VibeCodingNotes();
    console.log('Test passed: Application initialized successfully.');
} catch (error) {
    console.error('Test failed: Application failed to initialize.', error);
}
