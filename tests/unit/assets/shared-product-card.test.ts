// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  getProductImageUrls,
} = require('../../../app/assets/widgets/shared/components/product-card.js');

export {};

describe('shared product card data helpers', () => {
  it('normalizes product image URLs without duplicates', () => {
    expect(getProductImageUrls({
      imageUrl: 'https://cdn.example.test/primary.jpg',
      image: { src: 'https://cdn.example.test/primary.jpg' },
      featuredImage: { url: 'https://cdn.example.test/featured.jpg' },
      images: [
        { originalSrc: 'https://cdn.example.test/secondary.jpg' },
        { url: 'https://cdn.example.test/featured.jpg' },
        'https://cdn.example.test/third.jpg',
      ],
    })).toEqual([
      'https://cdn.example.test/primary.jpg',
      'https://cdn.example.test/featured.jpg',
      'https://cdn.example.test/secondary.jpg',
      'https://cdn.example.test/third.jpg',
    ]);
  });
});
