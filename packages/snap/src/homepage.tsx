import { Box, Text, Bold, Heading, Divider, Form, Field, Input, Button } from '@metamask/snaps-sdk/jsx';

/**
 * Render home page content
 * This is separated to avoid conditional rendering issues
 */
export function renderHomePage(coupons: any[]) {
  const couponCount = coupons.length;

  return (
    <Box>
      <Heading>💳 Prepaid Gas Manager</Heading>
      <Text>Manage prepaid gas coupons for gasless transactions</Text>
      <Divider />

      <Text>
        <Bold>Status:</Bold> {couponCount} coupon(s) configured
      </Text>

      <Divider />

      <Text>
        <Bold>Add Coupon:</Bold>
      </Text>

      <Form name="addCouponFormHome">
        <Field label="Gas Card Context">
          <Input
            name="couponCode"
            placeholder="Paste gas card context from testnet.prepaidgas.xyz"
          />
        </Field>
        <Field label="Label">
          <Input name="label" placeholder="My Gas Card" />
        </Field>
        <Button type="submit" name="submitCoupon">
          Add Coupon
        </Button>
      </Form>

      <Divider />

      <Text color="muted">
        Visit testnet.prepaidgas.xyz to get gas credits
      </Text>
    </Box>
  );
}

