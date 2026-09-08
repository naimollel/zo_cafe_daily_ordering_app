# ZO Café Daily Ordering

A lightweight, browser-based daily stock sheet that calculates the next order and prepares a WhatsApp message for **0657051162** (Tanzania country code is applied in the link).

Open `index.html` in any modern browser. Data stays in that browser until you clear the sheet. The supplied ZO Café logo is included at `assets/zo-cafe-logo.png`, so keep the `assets` folder beside the HTML file.

## Order calculation

`order quantity = maximum stock − physical closing stock`, with a minimum of zero.

The five pastry items have a fixed maximum of 6. Mango Passion is fixed at 4, Passion at 6, and Immunity Shot at 4. All other items have a selectable maximum from 0 to 6.
