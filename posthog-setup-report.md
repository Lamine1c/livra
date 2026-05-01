<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into LIVRA. The setup includes client-side initialization via `instrumentation-client.ts` (Next.js 15.3+ approach), a reverse proxy through Next.js rewrites for better reliability, a server-side PostHog client for API route tracking, user identification on login and signup, exception capture on auth errors, and 9 business events spanning the full order lifecycle.

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully logs in | `src/app/auth/login/page.tsx` |
| `user_signed_up` | User creates a new merchant account | `src/app/auth/register/page.tsx` |
| `order_created` | Merchant creates a new order | `src/app/dashboard/orders/new/page.tsx` |
| `order_otp_verified` | Client confirms order via WhatsApp OTP (server-side) | `src/app/api/orders/[id]/verify-otp/route.ts` |
| `order_otp_sent` | WhatsApp OTP code sent to client | `src/components/orders/otp-verify-widget.tsx` |
| `order_status_changed` | Merchant manually changes order status | `src/components/orders/order-status-select.tsx` |
| `order_deleted` | Merchant deletes an order | `src/components/orders/delete-order-button.tsx` |
| `yalidine_parcel_created` | Yalidine delivery parcel created (server-side) | `src/app/api/orders/[id]/yalidine/route.ts` |
| `client_created` | Merchant creates a new client | `src/components/clients/new-client-form.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/405982/dashboard/1534686
- **Order confirmation funnel** (login → order created → OTP confirmed): https://us.posthog.com/project/405982/insights/P04HHgy5
- **Orders created over time**: https://us.posthog.com/project/405982/insights/cVbjhyK6
- **Order status changes breakdown**: https://us.posthog.com/project/405982/insights/UMmyCD42
- **New merchant signups**: https://us.posthog.com/project/405982/insights/OuzSLhFc
- **Yalidine parcels created**: https://us.posthog.com/project/405982/insights/uZMHwYO9

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
