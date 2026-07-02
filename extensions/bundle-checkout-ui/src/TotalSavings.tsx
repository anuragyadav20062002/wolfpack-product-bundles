import '@shopify/ui-extensions/preact';
import {h, render} from 'preact';

import {TotalSavingsExtension} from './Checkout';

export default function extension() {
  render(h(TotalSavingsExtension, {}), document.body);
}
