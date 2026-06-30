import '@shopify/ui-extensions/preact';
import {render} from 'preact';

import {TotalSavingsExtension} from './Checkout';

export default function extension() {
  render(<TotalSavingsExtension />, document.body);
}
