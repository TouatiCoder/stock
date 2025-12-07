<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Material extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'category',
        'unit',
        'available',
        'minimum',
        'price',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'available' => 'decimal:2',
            'minimum' => 'decimal:2',
            'price' => 'decimal:2',
        ];
    }

    /**
     * Get the company that owns the material.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the projects that use this material.
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class)->withPivot('quantity', 'unit_price');
    }

    /**
     * Get the stock movements for this material.
     */
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
