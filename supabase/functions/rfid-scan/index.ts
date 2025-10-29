import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RFIDScanRequest {
  cart_id: number
  product_id: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { cart_id, product_id }: RFIDScanRequest = await req.json()

    console.log('RFID Scan:', { cart_id, product_id })

    // Validate input
    if (!cart_id || !product_id) {
      return new Response(
        JSON.stringify({ error: 'cart_id and product_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('Product not found:', productError)
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if product is in stock
    if (product.stock_quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Product out of stock' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart_id)
      .eq('product_id', product_id)
      .maybeSingle()

    if (existingItem) {
      // Update quantity
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + 1,
          item_weight: (existingItem.quantity + 1) * product.weight
        })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update cart item' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Cart item updated:', updatedItem)
    } else {
      // Add new item to cart
      const { data: newItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id,
          product_id,
          quantity: 1,
          item_weight: product.weight
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to add item to cart' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Cart item added:', newItem)
    }

    // Update cart total weight
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('item_weight')
      .eq('cart_id', cart_id)

    const totalWeight = cartItems?.reduce((sum, item) => sum + Number(item.item_weight), 0) || 0

    await supabase
      .from('carts')
      .update({
        total_weight: totalWeight,
        updated_at: new Date().toISOString()
      })
      .eq('id', cart_id)

    // Decrease stock
    await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - 1 })
      .eq('id', product_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Item added to cart',
        product: product.name,
        total_weight: totalWeight
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
