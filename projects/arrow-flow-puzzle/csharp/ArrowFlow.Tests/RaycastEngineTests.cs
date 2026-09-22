using System.Collections.Generic;
using ArrowFlow.Core;
using Xunit;

namespace ArrowFlow.Tests
{
    public class RaycastEngineTests
    {
        [Fact]
        public void Arrow_Facing_Boundary_Can_Escape_Directly()
        {
            var arrow = new ArrowData
            {
                Id = "a1",
                Row = 0,
                Col = 1,
                Direction = "up"
            };

            var activeArrows = new List<ArrowData> { arrow };

            bool canEscape = RaycastEngine.CanEscape(arrow, activeArrows, 3, 3, out var blocker);

            Assert.True(canEscape);
            Assert.Null(blocker);
        }

        [Fact]
        public void Arrow_Blocked_By_Another_Arrow_Returns_False_And_Identifies_Blocker()
        {
            var arrowMovingRight = new ArrowData
            {
                Id = "shooter",
                Row = 1,
                Col = 0,
                Direction = "right"
            };

            var blockingArrow = new ArrowData
            {
                Id = "obstacle",
                Row = 1,
                Col = 2,
                Direction = "up"
            };

            var activeArrows = new List<ArrowData> { arrowMovingRight, blockingArrow };

            bool canEscape = RaycastEngine.CanEscape(arrowMovingRight, activeArrows, 3, 3, out var blocker);

            Assert.False(canEscape);
            Assert.NotNull(blocker);
            Assert.Equal("obstacle", blocker!.Id);
        }

        [Fact]
        public void Arrow_Can_Escape_Diagonally_Clear_Of_Obstacles()
        {
            var diagonalArrow = new ArrowData
            {
                Id = "diag",
                Row = 2,
                Col = 0,
                Direction = "up-right" // Moves (1, 1) then (0, 2)
            };

            // Cardinal arrows placed at adjacent cells, but NOT in diagonal line
            var bystander1 = new ArrowData { Id = "b1", Row = 1, Col = 0, Direction = "up" };
            var bystander2 = new ArrowData { Id = "b2", Row = 2, Col = 1, Direction = "right" };

            var activeArrows = new List<ArrowData> { diagonalArrow, bystander1, bystander2 };

            bool canEscape = RaycastEngine.CanEscape(diagonalArrow, activeArrows, 3, 3, out var blocker);

            Assert.True(canEscape);
            Assert.Null(blocker);
        }

        [Fact]
        public void FindUnblockedArrows_Returns_Correct_Count()
        {
            var free1 = new ArrowData { Id = "free1", Row = 0, Col = 0, Direction = "up" };
            var free2 = new ArrowData { Id = "free2", Row = 2, Col = 2, Direction = "down" };
            var blocked = new ArrowData { Id = "blocked", Row = 1, Col = 0, Direction = "up" }; // Blocked by free1

            var activeArrows = new List<ArrowData> { free1, free2, blocked };

            var unblocked = RaycastEngine.FindUnblockedArrows(activeArrows, 3, 3);

            Assert.Equal(2, unblocked.Count);
            Assert.Contains(unblocked, a => a.Id == "free1");
            Assert.Contains(unblocked, a => a.Id == "free2");
            Assert.DoesNotContain(unblocked, a => a.Id == "blocked");
        }

        [Theory]
        [InlineData(1)]
        [InlineData(2)]
        [InlineData(5)]
        [InlineData(10)]
        public void Procedural_Generator_Produces_Valid_Levels_With_Initial_Moves(int seed)
        {
            var level = ProceduralGenerator.GenerateLevel(seed, 5, 5, seed);

            Assert.NotNull(level);
            Assert.NotEmpty(level.Arrows);

            var initialMoves = RaycastEngine.FindUnblockedArrows(level.Arrows, level.Rows, level.Cols);

            // Every valid game level must have at least 1 arrow that can escape at the start
            Assert.True(initialMoves.Count >= 1, $"Level seed {seed} must have at least one initial escape route");
        }
    }
}
