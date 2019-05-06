var documenterSearchIndex = {"docs": [

{
    "location": "#",
    "page": "F1Method.jl Documentation",
    "title": "F1Method.jl Documentation",
    "category": "page",
    "text": ""
},

{
    "location": "#F1Method.jl-Documentation-1",
    "page": "F1Method.jl Documentation",
    "title": "F1Method.jl Documentation",
    "category": "section",
    "text": "This package provides an efficient tool to compute gradient and Hessian matrix of an objective function implicitly defined by the solution of a steady-state problem."
},

{
    "location": "#Motvation-1",
    "page": "F1Method.jl Documentation",
    "title": "Motvation",
    "category": "section",
    "text": "When using Newton-type algorithms for optimization, computing the gradient and Hessian can be computationally expensive. A typical scientific application is to optimize the parameters of a model which solves for a root through another iterative Newton-like algorithm. In this case, there are a number of shortcuts that can be leveraged. This was the motivation for the work of Pasquier et al. (2019, in preparation), and for this package."
},

{
    "location": "#Usage-1",
    "page": "F1Method.jl Documentation",
    "title": "Usage",
    "category": "section",
    "text": "DocTestSetup = quote\n    using F1Method\n    using LinearAlgebra, DiffEqBase, ForwardDiff\nendThis is an example use of the software. We design a state function, boldsymbolF(boldsymbolxboldsymbolp), to which we apply a solver based on Newton\'s method (for root searching) to find the steady-state solution, boldsymbolx, such that boldsymbolF(boldsymbolxboldsymbolp) = 0. This defines the steady-state solution as an implicit function of the parameters, boldsymbolp. We denote this solution by boldsymbols(boldsymbolp). The Newton solver requires the Jacobian, nabla_boldsymbolxboldsymbolF, to update the state iterates. Hence, we start by creating the functions F(x,p) and ∇ₓF(x,p). As an example, we use a simple model with only two state variables and two parameters.# State function F\nF(x,p) = [\n    -2 * (p[1] - x[1]) - 4 * p[2] * (x[2] - x[1]^2) * x[1]\n    p[2] * (x[2] - x[1]^2)\n]\n\n# Jacobian of F wrt p\n∇ₓF(x,p) = ForwardDiff.jacobian(x -> F(x,p), x)\n\n# output\n\nF (generic function with 1 method)We also define a cost function f(x,p) (that we wish to minimize under the constraint that boldsymbolF(boldsymbolxboldsymbolp) = 0). (The F-1 method requires that we provide the derivatives w.r.t. the state, x, hence the use of ForwardDiff again for this exmaple.)# Define mismatch function f(x,p) and its derivative ∇ₓf(x,p)\n# (Note ∇ₓF and ∇ₓf are required by the F1 method)\nfunction state_mismatch(x)\n    δ(x) = x .- 1\n    return 0.5δ(x)\'δ(x)\nend\nfunction parameter_mismatch(p)\n    δ(p) = log.(p)\n    return 0.5δ(p)\'δ(p)\nend\nf(x,p) = state_mismatch(x) + parameter_mismatch(p)\n∇ₓf(x,p) = ForwardDiff.jacobian(x -> [f(x,p)], x)\n\n# output\n\n∇ₓf (generic function with 1 method)Once these are set up, we need to let the F-1 method know how to solve for the steady-state. We do this by using the DiffEqBase API. For that, we first write a small Newton solver algorithm, we overload the solve function from DiffEqBase, and we overload the SteadyStateProblem constructor.function newton_solve(F, ∇ₓF, x; Ftol=1e-10)\n    while norm(F(x)) ≥ Ftol\n        x .-= ∇ₓF(x) \\ F(x)\n    end\n    return x\nend\n\n# Create a type for the solver\'s algorithm\nstruct MyAlg <: DiffEqBase.AbstractSteadyStateAlgorithm end\n\n# Overload DiffEqBase\'s solve function\nfunction DiffEqBase.solve(prob::DiffEqBase.AbstractSteadyStateProblem,\n                          alg::MyAlg;\n                          Ftol=1e-10)\n    # Define the functions according to DiffEqBase.SteadyStateProblem type\n    p = prob.p\n    t = 0\n    x0 = copy(prob.u0)\n    dx, df = copy(x0), copy(x0)\n    F(x) = prob.f(dx, x, p, t)\n    ∇ₓF(x) = prob.f(df, dx, x, p, t)\n    # Compute `u_steady` and `resid` as per DiffEqBase using my algorithm\n    x_steady = newton_solve(F, ∇ₓF, x0, Ftol=Ftol)\n    resid = F(x_steady)\n    # Return the common DiffEqBase solution type\n    DiffEqBase.build_solution(prob, alg, x_steady, resid; retcode=:Success)\nend\n\n# Overload DiffEqBase\'s SteadyStateProblem constructor\nfunction DiffEqBase.SteadyStateProblem(F, ∇ₓF, x, p)\n    f(dx, x, p, t) = F(x, p)\n    f(df, dx, x, p, t) = ∇ₓF(x, p)\n    return DiffEqBase.SteadyStateProblem(f, x, p)\nend\n\n# output\n\nWe chose an initial value for the state, x, and the parameters, p:x₀, p₀ = [1.0, 2.0], [3.0, 4.0]\n\n# output\n\n([1.0, 2.0], [3.0, 4.0])Finally, we wrap the objective, gradient, and Hessian functions defined by the F-1 method.# Initialize the cache for storing reusable objects\nmem = F1Method.initialize_mem(x₀, p₀)\n# Define the functions via the F1 method\nF1_objective(p) = F1Method.f̂(f, F, ∇ₓF, mem, p, MyAlg())\nF1_gradient(p) = F1Method.∇f̂(f, F, ∇ₓf, ∇ₓF, mem, p, MyAlg())\nF1_Hessian(p) = F1Method.∇²f̂(f, F, ∇ₓf, ∇ₓF, mem, p, MyAlg())\n\n# output\n\nF1_Hessian (generic function with 1 method)We can now use these directly to compute objective, gradient, and Hessian:F1_objective(p₀)\n\n# output\n\n35.56438050824269F1_gradient(p₀)\n\n# output\n\n1×2 Array{Float64,2}:\n 50.3662  0.346574F1_Hessian(p₀)\n\n# output\n\n2×2 Array{Float64,2}:\n 52.989   0.0\n  0.0    -0.0241434"
},

]}
