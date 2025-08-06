# Google Maps weighted score extension

A Chrome extension that displays a recency weighted score for Google Maps.

## Reasoning

This extension analyzes Google Maps reviews and calculates a weighted score that gives more importance to recent reviews:

- **Last two months**: 100% weight
- **2-6 months**: 70% weight  
- **6-12 months**: 50% weight
- **1-2 years**: 30% weight
- **2-5 years**: 10% weight
- **Over 5 year**: 0

The weighted score appears next to the official Google Maps rating.

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder
5. Navigate to Google Maps and click on any place

## Technical details

- Uses Google Maps' internal API (`/rpc/listugcposts`)
- Analyzes review timestamps and ratings
- No external servers or data collection


## Disclaimer

This extension is for educational purposes. It uses Google Maps' internal API and should be used responsibly. Not affiliated with Google.

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License - see LICENSE file for details.
