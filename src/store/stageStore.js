import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substr(2, 9);
};

const initialStageOutputs = {
  stage1: null, // location, soilType, soilPH, suggestedCrops, selectedCrop
  stage2: null, // totalArea, areaUnit, perimeter, sideLengths[], centroid, polygon
  stage3: null, // seedType, plantingMethod, plantingRationale, layout, spacing, sowingMethod, tools[]
  stage4: null, // method, rationale, components[], waterNeeds, energyReq
  stage5: null, // seedTreatment, sowingTools[], germinationPlan[]
  stage6: {
    checkupLog: [] // Array of { timestamp, breakpointId, answers, diagnosis, organicFix, alertLevel }
  },
  stage7: null, // pest, confidence, treatments[], schedule[], products[] (independent)
  stage8: null, // readiness, rationale, checklist[], preHarvestSpray, yieldEstimate, products[]
  stage9: null, // conditions, treatments[], grading[], packaging[], seedProtocol, products[]
  stage10: null // prices[], bestMarket, earnings, channels[], packaging[], certSteps[]
};

export const useStageStore = create(
  persist(
    (set, get) => ({
      sessionId: generateSessionId(),
      currentStage: 1,
      maxReachedStage: 1,
      stageOutputs: { ...initialStageOutputs },
      loading: false,
      error: null,
      tokenBalance: 100000,
      useSimulationMode: false,
      customApiKey: '',

      setSessionId: (id) => set({ sessionId: id }),
      
      setCurrentStage: (stageNum) => {
        const nextStage = Math.max(1, Math.min(10, stageNum));
        set((state) => ({
          currentStage: nextStage,
          maxReachedStage: Math.max(state.maxReachedStage, nextStage)
        }));
      },

      setLoading: (isLoading) => set({ loading: isLoading }),
      setError: (err) => set({ error: err }),

      saveStageOutput: (stageKey, data) => {
        set((state) => ({
          stageOutputs: {
            ...state.stageOutputs,
            [stageKey]: {
              ...state.stageOutputs[stageKey],
              ...data
            }
          }
        }));
      },

      addCheckupLog: (logEntry) => {
        set((state) => {
          const currentLogs = state.stageOutputs.stage6?.checkupLog || [];
          return {
            stageOutputs: {
              ...state.stageOutputs,
              stage6: {
                ...state.stageOutputs.stage6,
                checkupLog: [
                  ...currentLogs,
                  {
                    ...logEntry,
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            }
          };
        });
      },

      syncToNextStage: (stageKey, currentStageData, nextStageNum) => {
        const { saveStageOutput, setCurrentStage } = get();
        saveStageOutput(stageKey, currentStageData);
        setCurrentStage(nextStageNum);
      },

      deductTokens: (amount) => {
        set((state) => ({
          tokenBalance: Math.max(0, state.tokenBalance - amount)
        }));
      },

      grantTokens: (amount) => {
        set((state) => ({
          tokenBalance: state.tokenBalance + amount,
          error: state.error === 'AI_CAPACITY_LIMIT_EXCEEDED' ? null : state.error
        }));
      },

      setSimulationMode: (enabled) => {
        set({ useSimulationMode: enabled });
      },

      saveCustomApiKey: (key) => {
        set({
          customApiKey: key,
          tokenBalance: 1000000, // 1,000,000 tokens for custom API key
          error: null
        });
      },

      removeCustomApiKey: () => {
        set({
          customApiKey: '',
          tokenBalance: 100000,
          error: null
        });
      },

      resetSession: () => {
        set({
          sessionId: generateSessionId(),
          currentStage: 1,
          maxReachedStage: 1,
          stageOutputs: JSON.parse(JSON.stringify(initialStageOutputs)),
          error: null,
          loading: false,
          tokenBalance: 100000,
          useSimulationMode: false,
          customApiKey: ''
        });
      }
    }),
    {
      name: 'agropilot-session-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
