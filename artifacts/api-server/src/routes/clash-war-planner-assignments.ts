import { Router, type IRouter } from "express";
import {
  GetWarPlannerQueryParams,
  GetWarPlannerResponse,
  UpsertWarPlannerAssignmentBody,
  UpsertWarPlannerAssignmentParams,
  UpsertWarPlannerAssignmentResponse,
} from "@workspace/api-zod";
import { asc, eq } from "drizzle-orm";
import { db, warPlannerAssignmentsTable } from "@workspace/db";
import { normalizeAttackerTag } from "../lib/clash-tags";

const router: IRouter = Router();

/* -------------------------------------------------------------------------- */
/* War Planner - load assignments                                             */
/* -------------------------------------------------------------------------- */

router.get(
  "/clash/war-planner",
  async (req, res): Promise<void> => {
    const parsedQuery =
      GetWarPlannerQueryParams.safeParse({
        warKey: req.query.warKey,
      });

    if (!parsedQuery.success) {
      res.status(400).json({
        error:
          "A valid war key is required.",
        code: "INVALID_WAR_KEY",
      });
      return;
    }

    const { warKey } =
      parsedQuery.data;

    const assignments =
      await db
        .select()
        .from(warPlannerAssignmentsTable)
        .where(
          eq(
            warPlannerAssignmentsTable.warKey,
            warKey,
          ),
        )
        .orderBy(
          asc(
            warPlannerAssignmentsTable.attackerTag,
          ),
        );

    res.json(
      GetWarPlannerResponse.parse({
        warKey,
        assignments,
      }),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* War Planner - save assignment                                              */
/* -------------------------------------------------------------------------- */

async function saveWarPlannerAssignment(
  req: any,
  res: any,
): Promise<void> {
  const parsedParams =
    UpsertWarPlannerAssignmentParams.safeParse(
      {
        attackerTag:
          req.params.attackerTag,
      },
    );

  const parsedBody =
    UpsertWarPlannerAssignmentBody.safeParse(
      req.body,
    );

  if (
    !parsedParams.success ||
    !parsedBody.success
  ) {
    res.status(400).json({
      error:
        "The planner assignment is invalid.",
      code:
        "INVALID_WAR_PLANNER_ASSIGNMENT",
    });
    return;
  }

  const attackerTag =
    normalizeAttackerTag(
      parsedParams.data.attackerTag,
    );

  const {
    warKey,
    assignedTargetMapPosition,
    locked,
    completed,
  } = parsedBody.data;

  try {
    const [assignment] =
      await db
        .insert(
          warPlannerAssignmentsTable,
        )
        .values({
          warKey,
          attackerTag,
          assignedTargetMapPosition,
          locked,
          completed,
        })
        .onConflictDoUpdate({
          target: [
            warPlannerAssignmentsTable.warKey,
            warPlannerAssignmentsTable.attackerTag,
          ],
          set: {
            assignedTargetMapPosition,
            locked,
            completed,
            updatedAt: new Date(),
          },
        })
        .returning();

    if (!assignment) {
      res.status(500).json({
        error:
          "The planner assignment could not be saved.",
        code:
          "WAR_PLANNER_SAVE_FAILED",
      });
      return;
    }

    res.json(
      UpsertWarPlannerAssignmentResponse.parse(
        assignment,
      ),
    );
  } catch (error) {
    req.log?.error?.(
      {
        error,
        attackerTag,
        warKey,
      },
      "Could not save war planner assignment",
    );

    res.status(500).json({
      error:
        "Could not save the planner assignment.",
      code:
        "WAR_PLANNER_DATABASE_ERROR",
    });
  }
}

/*
 * The frontend uses POST.
 */
router.post(
  "/clash/war-planner/:attackerTag",
  saveWarPlannerAssignment,
);

/*
 * Keep PUT support as well so older frontend code
 * continues to work.
 */
router.put(
  "/clash/war-planner/:attackerTag",
  saveWarPlannerAssignment,
);

export default router;

export default router;
