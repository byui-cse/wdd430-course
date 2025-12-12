<script>
  import { supabase, initializeSupabase } from "../../lib/supabase"; // Your setup file
  import { onMount } from "svelte";

  /** @type {import('svelte').Snippet} */
  let { children } = $props();

  let passcode = $state("");
  let isAuthenticated = $state(false);
  let isLoading = $state(true); // Start loading to check localStorage
  let error = $state("");

  onMount(async () => {
    const saved = localStorage.getItem("bakeoff_passcode");
    if (saved) {
      passcode = saved;
      // Verify the saved token is still valid
      await verifyAndLogin(saved);
    }
    isLoading = false;
  });

  async function verifyAndLogin(codeToTest) {
    error = "";

    // 1. Initialize client with passcode so RLS/header-based checks work
    initializeSupabase(codeToTest);
    try {
      // 2. Ask the database: "Is this header valid?".
      const { data, error: rpcError } = await supabase.rpc("verify_passcode", {
        input_code: codeToTest
      });

      if (rpcError) throw rpcError;

      if (data === true) {
        // Success!
        isAuthenticated = true;
        // initializeSupabase(codeToTest);
        localStorage.setItem("bakeoff_passcode", codeToTest);
      } else {
        // Failure: The logic ran, but the code was wrong
        throw new Error("Invalid passcode");
      }
    } catch (err) {
      console.error("Login failed:", err);
      error = "Incorrect passcode. Please try again.";

      // Clean up
      initializeSupabase();
      localStorage.removeItem("bakeoff_passcode");
      isAuthenticated = false;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!passcode) return;
    await verifyAndLogin(passcode);
  }

  function logout() {
    localStorage.removeItem("bakeoff_passcode");
    initializeSupabase();
    passcode = "";
    isAuthenticated = false;
  }
</script>

{#if isLoading}
  <div class="center-screen">
    <div class="spinner"></div>
  </div>
{:else if !isAuthenticated}
  <div class="passcode-gate">
    <div class="lock-icon">🔒</div>
    <h2>Private Access</h2>
    <p>Enter the bakeoff passcode to view and edit scores.</p>

    <form onsubmit={handleSubmit}>
      <input
        type="password"
        bind:value={passcode}
        placeholder="Enter Passcode..."
        class:input-error={!!error}
      />
      {#if error}
        <div class="error-msg">{error}</div>
      {/if}
      <button type="submit">Unlock</button>
    </form>
  </div>
{:else}
  {@render children()}

  <button onclick={logout} class="logout-btn">
    <span class="lock-small">🔒</span> Lock App
  </button>
{/if}

<style>
  /* --- Layout --- */
  .center-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f9fafb;
  }

  .passcode-gate {
    max-width: 24rem;
    margin: 6rem auto;
    text-align: center;
    padding: 2.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    font-family: system-ui, sans-serif;
  }

  .lock-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0 0 0.5rem 0;
    color: #111827;
  }
  p {
    color: #6b7280;
    margin-bottom: 2rem;
  }

  /* --- Form --- */
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  input {
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .input-error {
    border-color: #ef4444;
  }
  .error-msg {
    color: #ef4444;
    font-size: 0.875rem;
    text-align: left;
  }

  button {
    padding: 0.75rem;
    font-size: 1rem;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  button:hover {
    background-color: #4338ca;
  }

  /* --- Logout Button --- */
  .logout-btn {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    background-color: #1f2937;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.8;
    transition: opacity 0.2s;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .logout-btn:hover {
    opacity: 1;
  }
  .lock-small {
    font-size: 0.8rem;
  }

  /* --- Spinner --- */
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
