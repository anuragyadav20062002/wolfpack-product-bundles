// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createBundleBannerElement } = require('../../../app/assets/widgets/shared/components/bundle-banners.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createStepBannerImageElement } = require('../../../app/assets/widgets/shared/components/bundle-banners.js');

function createFakeDocument() {
  const createElement = (tagName: string) => {
    const element: any = {
      tagName,
      className: '',
      children: [],
      classList: {
        add: (...classNames: string[]) => {
          element.className = [element.className, ...classNames].filter(Boolean).join(' ');
        },
      },
      appendChild: (child: any) => {
        element.children.push(child);
      },
      querySelectorAll: (selector: string) => (
        selector === 'img' ? element.children.filter((child: any) => child.tagName === 'img') : []
      ),
      getAttribute: (name: string) => element[name],
    };
    return element;
  };

  return { createElement };
}

describe('shared bundle banners contract', () => {
  it('returns null when no banner URLs are configured', () => {
    expect(createBundleBannerElement({}, createFakeDocument())).toBeNull();
  });

  it('renders desktop and mobile banner images with stable classes', () => {
    const element = createBundleBannerElement({
      desktopBannerUrl: 'https://cdn.example.test/desktop.jpg',
      mobileBannerUrl: 'https://cdn.example.test/mobile.jpg',
    }, createFakeDocument());

    expect(element).not.toBeNull();
    expect(element?.className).toContain('bundle-banners');
    expect(element?.className).toContain('bundle-banners--has-desktop');
    expect(element?.className).toContain('bundle-banners--has-mobile');

    const images = element?.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images?.[0]?.className).toBe('bundle-banner-image bundle-banner-image--desktop');
    expect(images?.[0]?.getAttribute('src')).toBe('https://cdn.example.test/desktop.jpg');
    expect(images?.[0]?.getAttribute('loading')).toBe('lazy');
    expect(images?.[1]?.className).toBe('bundle-banner-image bundle-banner-image--mobile');
  });
});

describe('shared step banner image contract', () => {
  it('returns null when a step has no banner image URL', () => {
    expect(createStepBannerImageElement({}, (value: string) => value, createFakeDocument())).toBeNull();
  });

  it('renders the step banner image with escaped alt text', () => {
    const element = createStepBannerImageElement({
      name: '<Step One>',
      bannerImageUrl: 'https://cdn.example.test/step.jpg',
    }, (value: string) => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'), createFakeDocument());

    expect(element).not.toBeNull();
    expect(element?.className).toBe('step-banner-image');

    const images = element?.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images?.[0]?.getAttribute('src')).toBe('https://cdn.example.test/step.jpg');
    expect(images?.[0]?.getAttribute('alt')).toBe('&lt;Step One&gt;');
  });
});
