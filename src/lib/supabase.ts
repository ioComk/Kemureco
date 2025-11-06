import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseCredentials() {
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			"Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
		);
	}

	return {
		supabaseUrl: supabaseUrl as string,
		supabaseAnonKey: supabaseAnonKey as string,
	};
}

let browserClient: SupabaseClient<Database> | null = null;

function createSupabaseBrowserClient() {
	const credentials = getSupabaseCredentials();
	if (!browserClient) {
		browserClient = createClient<Database>(
			credentials.supabaseUrl,
			credentials.supabaseAnonKey,
			{
				auth: {
					persistSession: true,
					autoRefreshToken: true,
					detectSessionInUrl: true,
				},
			},
		);
	}
	return browserClient;
}

function createSupabaseServerClient() {
	const credentials = getSupabaseCredentials();
	return createClient<Database>(
		credentials.supabaseUrl,
		credentials.supabaseAnonKey,
		{
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		},
	);
}

export function createSupabaseClient(): SupabaseClient<Database> {
	if (typeof window === "undefined") {
		return createSupabaseServerClient();
	}
	return createSupabaseBrowserClient();
}
