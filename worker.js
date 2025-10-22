export default {
    async fetch(request, env, ctx) {
        console.log('alive!')
        return new Response('hi dude');
    }
} 