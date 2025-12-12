<script>
  import { supabase } from "../../lib/supabase.ts";
  /**
   * @typedef {Object} Props
   * @property {string} projectId - The ID of the project this scorecard belongs to
   * @property {import('@supabase/supabase-js').SupabaseClient} supabase - Your Supabase client instance
   * @property {Function} [onSuccess] - Optional callback after successful submission
   */

  /** @type {Props} */
  let { onSuccess } = $props();
  let params = window.location.search;
  let urlParams = new URLSearchParams(params);
  let projectId = urlParams.get("project");
  let scorecardId = urlParams.get("scorecard");
  // --- 1. State Management (Using Runes) ---

  let stackName = $state("");
  let scorableBy = $state("");
  let dateScored = $state(new Date().toISOString().slice(0, 10));
  let notes = $state("");
  let isSubmitting = $state(false);
  let errorMessage = $state("");
  let isLoading = $state(false);

  // Category I: Performance
  let vitalsScore = $state(0);
  let lcp = $state(0);
  let inp = $state(0);
  let tbt = $state(0);
  let cls = $state(0); // NEW: Cumulative Layout Shift
  let speedIndex = $state(0); // NEW: Speed Index

  // Category II: Bundle & Resources
  let jsBundleSize = $state(0);
  let ttfb = $state(0);
  let cssSize = $state(0);

  // Category III: Developer Experience
  let featureVelocity = $state(0);
  let hotReload = $state(0);
  let devDeps = $state(0); // NEW: Dev Dependencies Count

  let dxFrustration = $state(3);
  let dxResources = $state(3);
  let dxSuccess = $state(3);
  let dxAiSuccess = $state(3);
  let dxReadability = $state(3);

  // Category IV: Operational
  let opSetup = $state(3);
  let opCommunity = $state(3);
  let opDeploymentEase = $state(3);
  let opDeploymentChoice = $state(3);

  // --- 2. Derived Calculations ---

  // I. Performance (Max Raw: 150)
  let scoreLcp = $derived.by(() => {
    if (lcp <= 2.5) return 10;
    if (lcp >= 5.0) return 1;
    return 10 - ((lcp - 2.5) / 2.5) * 9;
  });
  let scoreInp = $derived.by(() => {
    if (inp <= 200) return 10;
    if (inp >= 500) return 1;
    return 10 - ((inp - 200) / 300) * 9;
  });
  let scoreTbt = $derived.by(() => {
    if (tbt <= 200) return 10;
    if (tbt >= 500) return 1;
    return 10 - ((tbt - 200) / 300) * 9;
  });
  // NEW: CLS Calculation (Goal < 0.1, Poor > 0.25)
  let scoreCls = $derived.by(() => {
    if (cls <= 0.1) return 10;
    if (cls >= 0.25) return 1;
    return 10 - ((cls - 0.1) / 0.15) * 9;
  });
  // NEW: Speed Index Calculation (Goal < 3.4s, Poor > 5.8s)
  let scoreSi = $derived.by(() => {
    if (speedIndex <= 3.4) return 10;
    if (speedIndex >= 5.8) return 1;
    return 10 - ((speedIndex - 3.4) / 2.4) * 9;
  });

  let cat1_raw = $derived(
    vitalsScore + scoreLcp + scoreInp + scoreTbt + scoreCls + scoreSi
  );
  // Normalize (Raw / 150) * 100 * Weight (0.40)
  let cat1_weighted = $derived((cat1_raw / 150) * 100 * 0.4);

  // II. Bundle (Max Raw: 100)
  let scoreJs = $derived.by(() => {
    if (jsBundleSize <= 100) return 50;
    if (jsBundleSize >= 500) return 5;
    return 50 - ((jsBundleSize - 100) / 400) * 45;
  });
  let scoreTtfb = $derived.by(() => {
    if (ttfb <= 500) return 30;
    if (ttfb >= 1500) return 5;
    return 30 - ((ttfb - 500) / 1000) * 25;
  });
  let scoreCss = $derived.by(() => {
    if (cssSize <= 20) return 20;
    if (cssSize >= 100) return 2;
    return 20 - ((cssSize - 20) / 80) * 18;
  });
  let cat2_raw = $derived(scoreJs + scoreTtfb + scoreCss);
  let cat2_weighted = $derived((cat2_raw / 100) * 100 * 0.25);

  // III. DX (Max Raw: 120)
  // Objective
  let scoreVelocity = $derived.by(() => {
    if (featureVelocity <= 4) return 40;
    if (featureVelocity >= 20) return 5;
    return 40 - ((featureVelocity - 4) / 16) * 35;
  });
  let scoreHmr = $derived.by(() => {
    if (hotReload <= 200) return 20;
    if (hotReload >= 2000) return 2;
    return 20 - ((hotReload - 200) / 1800) * 18;
  });
  // NEW: Dev Dependencies (Goal < 5, Poor > 20)
  let scoreDevDeps = $derived.by(() => {
    if (devDeps <= 5) return 20;
    if (devDeps >= 20) return 1;
    return 20 - ((devDeps - 5) / 15) * 19;
  });

  // Qualitative
  let scoreFrustration = $derived(6 - dxFrustration);
  let avgDxRating = $derived(
    (scoreFrustration + dxResources + dxSuccess + dxReadability) / 4
  );
  let scoreQualitative = $derived(avgDxRating * 6);
  let scoreAi = $derived(dxAiSuccess * 2);

  let cat3_raw = $derived(
    scoreVelocity + scoreHmr + scoreDevDeps + scoreQualitative + scoreAi
  );
  // Normalize (Raw / 120) * 100 * Weight (0.25)
  let cat3_weighted = $derived((cat3_raw / 120) * 100 * 0.25);

  // IV. Operational (Max Raw: 200)
  let scoreSetup = $derived(opSetup * 10);
  let scoreCommunity = $derived(opCommunity * 10);
  let scoreDeploymentEase = $derived(opDeploymentEase * 10);
  let scoreDeploymentChoice = $derived(opDeploymentChoice * 10);
  let cat4_raw = $derived(
    scoreSetup + scoreCommunity + scoreDeploymentEase + scoreDeploymentChoice
  );
  // Normalize (Raw / 200) * 100 * Weight (0.10)
  let cat4_weighted = $derived((cat4_raw / 200) * 100 * 0.1);

  let finalScore = $derived(
    cat1_weighted + cat2_weighted + cat3_weighted + cat4_weighted
  );

  // --- 3. Submission ---
  async function handleSubmit(e) {
    e.preventDefault();
    isSubmitting = true;
    errorMessage = "";
    try {
      const payload = {
        project_id: projectId,
        stack_name: stackName,
        scorable_by: scorableBy,
        date_scored: dateScored,
        notes: notes,
        score_performance_raw: {
          vitals: vitalsScore,
          lcp,
          inp,
          tbt,
          cls,
          speed_index: speedIndex
        },
        score_bundle_raw: {
          js_kib: jsBundleSize,
          css_kib: cssSize,
          ttfb_ms: ttfb
        },
        score_dx_raw: {
          velocity_hours: featureVelocity,
          hmr_ms: hotReload,
          dev_deps: devDeps,
          ratings: {
            frustration: dxFrustration,
            resources: dxResources,
            success: dxSuccess,
            readability: dxReadability,
            ai: dxAiSuccess
          }
        },
        score_operational_raw: {
          setup: opSetup,
          community: opCommunity,
          deployment_ease: opDeploymentEase,
          deployment_choice: opDeploymentChoice
        },
        final_score_snapshot: parseFloat(finalScore.toFixed(2))
      };

      if (scorecardId) {
        const { data, error } = await supabase
          .from("scorecards")
          .update(payload)
          .eq("id", scorecardId)
          .select("*")
          .maybeSingle();
        if (error) throw error;
        if (!data)
          throw new Error(
            "Update returned no rows — check that the id exists and your RLS/headers allow this update"
          );
        if (onSuccess) onSuccess();
        else
          window.location.href = `/bakeoff/project/?id=${encodeURIComponent(projectId)}`;
      } else {
        const { data, error } = await supabase
          .from("scorecards")
          .insert([payload])
          .select("*")
          .single();
        if (error) throw error;
        if (onSuccess) onSuccess();
        else
          window.location.href = `/bakeoff/project/?id=${encodeURIComponent(projectId)}`;
      }
    } catch (err) {
      console.error("Error saving scorecard:", err);
      errorMessage = err.message || "Failed to save scorecard.";
    } finally {
      isSubmitting = false;
    }
  }

  // Load existing scorecard when editing
  $effect(() => {
    async function loadScorecard() {
      if (!scorecardId) return;
      isLoading = true;
      try {
        const { data, error } = await supabase
          .from("scorecards")
          .select("*")
          .eq("id", scorecardId)
          .limit(1)
          .single();
        if (error) throw error;
        const sc = data;
        // Map fields safely
        projectId = sc.project_id || projectId;
        stackName = sc.stack_name || "";
        scorableBy = sc.scorable_by || "";
        dateScored = sc.date_scored || dateScored;
        notes = sc.notes || "";

        const perf = sc.score_performance_raw || {};
        vitalsScore = perf.vitals ?? vitalsScore;
        lcp = perf.lcp ?? lcp;
        inp = perf.inp ?? inp;
        tbt = perf.tbt ?? tbt;
        cls = perf.cls ?? cls;
        speedIndex = perf.speed_index ?? speedIndex;

        const bund = sc.score_bundle_raw || {};
        jsBundleSize = bund.js_kib ?? jsBundleSize;
        cssSize = bund.css_kib ?? cssSize;
        ttfb = bund.ttfb_ms ?? ttfb;

        const dx = sc.score_dx_raw || {};
        featureVelocity = dx.velocity_hours ?? featureVelocity;
        hotReload = dx.hmr_ms ?? hotReload;
        devDeps = dx.dev_deps ?? devDeps;
        const ratings = dx.ratings || {};
        dxFrustration = ratings.frustration ?? dxFrustration;
        dxResources = ratings.resources ?? dxResources;
        dxSuccess = ratings.success ?? dxSuccess;
        dxReadability = ratings.readability ?? dxReadability;
        dxAiSuccess = ratings.ai ?? dxAiSuccess;

        const op = sc.score_operational_raw || {};
        opSetup = op.setup ?? opSetup;
        opCommunity = op.community ?? opCommunity;
        opDeploymentEase = op.deployment_ease ?? opDeploymentEase;
        opDeploymentChoice = op.deployment_choice ?? opDeploymentChoice;
      } catch (err) {
        console.error("Error loading scorecard:", err);
        errorMessage = err.message || "Failed to load scorecard.";
      } finally {
        isLoading = false;
      }
    }
    loadScorecard();
  });
</script>

<div class="scorecard-container">
  <div class="header">
    <h2>{scorecardId ? "Edit Bakeoff Scorecard" : "New Bakeoff Scorecard"}</h2>
    <p>
      Hover over the <span class="tooltip-icon inline-icon">?</span> icons to see
      measurement guides.
    </p>
  </div>

  <form onsubmit={handleSubmit}>
    <div class="section metadata">
      <div class="form-group">
        <label for="stack">Stack Name</label>
        <input
          type="text"
          id="stack"
          bind:value={stackName}
          required
          placeholder="e.g. SvelteKit"
        />
      </div>
      <div class="form-group">
        <label for="scorer">Scored By</label>
        <input type="text" id="scorer" bind:value={scorableBy} required />
      </div>
      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" bind:value={dateScored} required />
      </div>
    </div>

    <div class="split-row">
      <fieldset class="category-box">
        <legend>I. Performance (40%)</legend>
        <div class="grid-2">
          <div class="form-group">
            <div class="label-row">
              <label for="vitals">Core Vitals (0-100)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Use aggregated score from Lighthouse/PageSpeed Insights. Goal:
                  95+
                </div>
              </div>
            </div>
            <input
              type="number"
              id="vitals"
              bind:value={vitalsScore}
              min="0"
              max="100"
            />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="lcp">LCP (Seconds)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Largest Contentful Paint. Goal &le; 2.5s
                </div>
              </div>
            </div>
            <input type="number" id="lcp" step="0.1" bind:value={lcp} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="inp">INP (ms)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Interaction to Next Paint. Goal &le; 200ms
                </div>
              </div>
            </div>
            <input type="number" id="inp" bind:value={inp} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="tbt">TBT (ms)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Total Blocking Time. Goal &le; 200ms
                </div>
              </div>
            </div>
            <input type="number" id="tbt" bind:value={tbt} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="cls">CLS (Score)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Cumulative Layout Shift. Visual stability. Goal &le; 0.1
                </div>
              </div>
            </div>
            <input type="number" id="cls" step="0.01" bind:value={cls} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="si">Speed Index (s)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  How quickly content is populated. Goal &le; 3.4s
                </div>
              </div>
            </div>
            <input type="number" id="si" step="0.1" bind:value={speedIndex} />
          </div>
        </div>
        <div class="category-footer">
          <span class="sub-score">{cat1_weighted.toFixed(1)} / 40.0</span>
        </div>
      </fieldset>

      <fieldset class="category-box">
        <legend>II. Bundle & Resources (25%)</legend>
        <div class="grid-2">
          <div class="form-group span-2">
            <div class="label-row">
              <label for="js">Total JS (KiB)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Compressed transfer size. Lower is better.
                </div>
              </div>
            </div>
            <input type="number" id="js" bind:value={jsBundleSize} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="ttfb">TTFB (ms)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Server response time. Goal &le; 500ms
                </div>
              </div>
            </div>
            <input type="number" id="ttfb" bind:value={ttfb} />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="css">Initial CSS (KiB)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Measure total payload, not just initial CSS.
                </div>
              </div>
            </div>
            <input type="number" id="css" bind:value={cssSize} />
          </div>
        </div>
        <div class="category-footer">
          <span class="sub-score">{cat2_weighted.toFixed(1)} / 25.0</span>
        </div>
      </fieldset>
    </div>

    <div class="split-row">
      <fieldset class="category-box">
        <legend>III. Developer Experience (25%)</legend>
        <div class="sub-section">
          <h4>Objective Metrics</h4>
          <div class="grid-2">
            <div class="form-group">
              <div class="label-row">
                <label for="velocity">Velocity (Hrs)</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Time taken to implement pre-defined features.
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="velocity"
                step="0.5"
                bind:value={featureVelocity}
              />
            </div>
            <div class="form-group">
              <div class="label-row">
                <label for="hmr">Hot Reload (ms)</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Avg time for code changes to reflect in browser.
                  </div>
                </div>
              </div>
              <input type="number" id="hmr" bind:value={hotReload} />
            </div>
            <div class="form-group span-2">
              <div class="label-row">
                <label for="deps">Dev Dependencies (Count)</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Total # of required non-dev packages (router, state, etc).
                    Lower is better.
                  </div>
                </div>
              </div>
              <input type="number" id="deps" bind:value={devDeps} />
            </div>
          </div>
        </div>

        <div class="sub-section">
          <h4>Qualitative (1-5 Scale)</h4>
          <div class="grid-5-compact">
            <div class="mini-input">
              <div class="label-row center">
                <label for="frust">Frust.</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    How often did hard-to-debug issues occur? (1=Low/Good)
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="frust"
                min="1"
                max="5"
                bind:value={dxFrustration}
              />
              <span class="tiny-text">(1=Low)</span>
            </div>
            <div class="mini-input">
              <div class="label-row center">
                <label for="res">Rsrcs</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Ease of finding documentation and solutions.
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="res"
                min="1"
                max="5"
                bind:value={dxResources}
              />
            </div>
            <div class="mini-input">
              <div class="label-row center">
                <label for="succ">Succ.</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Rate of successfully overcoming roadblocks.
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="succ"
                min="1"
                max="5"
                bind:value={dxSuccess}
              />
            </div>
            <div class="mini-input">
              <div class="label-row center">
                <label for="read">Read.</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Code maintainability and onboarding ease.
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="read"
                min="1"
                max="5"
                bind:value={dxReadability}
              />
            </div>
            <div class="mini-input ai-highlight">
              <div class="label-row center">
                <label for="ai">AI Help</label>
                <div class="tooltip-icon">
                  ?
                  <div class="tooltip-text">
                    Effectiveness of LLMs for stack-specific problems.
                  </div>
                </div>
              </div>
              <input
                type="number"
                id="ai"
                min="1"
                max="5"
                bind:value={dxAiSuccess}
              />
            </div>
          </div>
        </div>
        <div class="category-footer">
          <span class="sub-score">{cat3_weighted.toFixed(1)} / 25.0</span>
        </div>
      </fieldset>

      <fieldset class="category-box flex-col">
        <legend>IV. Operational (10%)</legend>
        <div class="grid-2">
          <div class="form-group">
            <div class="label-row">
              <label for="setup">Setup Ease (1-5)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Ease of CI/CD integration and local env setup.
                </div>
              </div>
            </div>
            <input
              type="number"
              id="setup"
              min="1"
              max="5"
              bind:value={opSetup}
            />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="community">Community (1-5)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  Based on GitHub stars, NPM activity, ecosystem size.
                </div>
              </div>
            </div>
            <input
              type="number"
              id="community"
              min="1"
              max="5"
              bind:value={opCommunity}
            />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="deploy-ease">Deployment Ease (1-5)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  How easy is it to deploy the app.
                </div>
              </div>
            </div>
            <input
              type="number"
              id="deploy-ease"
              min="1"
              max="5"
              bind:value={opDeploymentEase}
            />
          </div>
          <div class="form-group">
            <div class="label-row">
              <label for="deploy-choice">Deployment Choice (1-5)</label>
              <div class="tooltip-icon">
                ?
                <div class="tooltip-text">
                  How many different options do you have for deployment.
                </div>
              </div>
            </div>
            <input
              type="number"
              id="deploy-choice"
              min="1"
              max="5"
              bind:value={opDeploymentChoice}
            />
          </div>
        </div>
        <div class="category-footer mt-auto">
          <span class="sub-score">{cat4_weighted.toFixed(1)} / 10.0</span>
        </div>
      </fieldset>
    </div>

    <div class="score-banner">
      <div class="score-details">
        <h3>Total Weighted Score</h3>
        <div class="breakdown">
          <span>Perf: {cat1_weighted.toFixed(1)}</span>
          <span>Bundle: {cat2_weighted.toFixed(1)}</span>
          <span>DX: {cat3_weighted.toFixed(1)}</span>
          <span>Ops: {cat4_weighted.toFixed(1)}</span>
        </div>
      </div>
      <div class="score-big">
        {finalScore.toFixed(1)}
        <span class="score-max">/ 100</span>
      </div>
    </div>

    <div class="form-group notes-section">
      <label for="notes">Notes / Conclusion</label>
      <textarea id="notes" bind:value={notes} rows="3"></textarea>
    </div>

    {#if errorMessage}
      <div class="error-message"><span>⚠️</span> {errorMessage}</div>
    {/if}

    <button
      type="submit"
      disabled={isSubmitting || isLoading}
      class="submit-btn"
    >
      {#if isLoading}
        Loading scorecard...
      {:else}
        {isSubmitting
          ? "Saving Scorecard..."
          : scorecardId
            ? "Update Scorecard"
            : "Save & Submit Scorecard"}
      {/if}
    </button>
  </form>
</div>

<style>
  /* --- Global & Layout --- */
  .scorecard-container {
    max-width: 64rem;
    margin: 0 auto;
    padding: 1.5rem;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #1f2937;
  }

  .header {
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }
  .header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: #111827;
  }
  .header p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  /* --- Form Grid --- */
  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .section {
    padding: 1.25rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }
  .metadata {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .metadata {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .split-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  @media (min-width: 1024px) {
    .split-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .span-2 {
    grid-column: span 2;
  }
  .flex-col {
    display: flex;
    flex-direction: column;
  }
  .mt-auto {
    margin-top: auto;
  }

  fieldset.category-box {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin: 0;
    position: relative;
  }
  legend {
    font-size: 0.875rem;
    font-weight: 700;
    color: #4f46e5;
    text-transform: uppercase;
    padding: 0 0.5rem;
    margin-left: -0.5rem;
  }

  /* --- Inputs & Labels --- */
  .form-group {
    display: flex;
    flex-direction: column;
  }

  /* TOOLTIP STYLES */
  .label-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.25rem;
  }
  .label-row.center {
    justify-content: center;
  }

  label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    margin: 0;
  }

  .tooltip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    font-size: 10px;
    font-weight: bold;
    color: #9ca3af;
    border: 1px solid #d1d5db;
    border-radius: 50%;
    cursor: help;
    position: relative;
    background: #fff;
  }
  .tooltip-icon.inline-icon {
    display: inline-flex;
    width: 18px;
    height: 18px;
    font-size: 12px;
    margin: 0 2px;
    vertical-align: middle;
    transform: translateY(-1px);
  }

  .tooltip-text {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: 140%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1f2937;
    color: #fff;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: normal;
    white-space: normal;
    width: max-content;
    max-width: 200px;
    text-align: center;
    z-index: 50;
    transition:
      opacity 0.2s,
      visibility 0.2s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    pointer-events: none;
  }
  /* Tooltip Arrow */
  .tooltip-text::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: #1f2937 transparent transparent transparent;
  }
  .tooltip-icon:hover {
    color: #4f46e5;
    border-color: #4f46e5;
  }
  .tooltip-icon:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }

  input,
  textarea {
    margin-top: 0.1rem;
    display: block;
    width: 100%;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    padding: 0.5rem;
    font-size: 0.95rem;
    box-sizing: border-box;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
  }

  /* --- DX Mini Inputs --- */
  .sub-section {
    margin-bottom: 1.25rem;
  }
  .sub-section h4 {
    font-size: 0.75rem;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    margin: 0 0 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .grid-5-compact {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }
  .mini-input {
    text-align: center;
  }
  .mini-input input {
    text-align: center;
    padding: 0.25rem;
  }
  .tiny-text {
    font-size: 0.6rem;
    color: #9ca3af;
    display: block;
    margin-top: 0.1rem;
  }

  .ai-highlight label {
    color: #7c3aed;
  }
  .ai-highlight input {
    background-color: #f5f3ff;
    border-color: #ddd6fe;
  }

  /* --- Footers & Banners --- */
  .category-footer {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: flex-end;
  }
  .sub-score {
    font-size: 0.875rem;
    font-family: monospace;
    color: #4338ca;
    font-weight: 700;
  }

  .score-banner {
    background: linear-gradient(to right, #312e81, #3730a3);
    color: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  .score-details h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }
  .breakdown {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #c7d2fe;
    margin-top: 0.25rem;
  }
  .score-big {
    font-size: 3.5rem;
    font-weight: 900;
    line-height: 1;
  }
  .score-max {
    font-size: 1.125rem;
    font-weight: 500;
    color: #a5b4fc;
    opacity: 0.6;
  }

  /* --- Actions --- */
  .notes-section {
    background-color: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }
  .error-message {
    padding: 1rem;
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .submit-btn {
    width: 100%;
    padding: 1rem;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .submit-btn:hover {
    background-color: #4338ca;
  }
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
